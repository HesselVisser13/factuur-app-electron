// src/main/services/fotos.service.ts

import { randomUUID } from 'node:crypto'
import { copyFileSync, existsSync, statSync, unlinkSync } from 'node:fs'
import { extname } from 'node:path'

import exifr from 'exifr'
import sharp from 'sharp'

import { FOTO_LIMITS, SUPPORTED_FOTO_EXTS } from '../../shared/constants'
import { getDatabase } from '../db/client'
import { log } from '../logger'
import { getKlantFotoPath, getKlantFotoThumbPath } from '../paths'

// ============================================================
// Types
// ============================================================

export interface FotoRecord {
  id: number
  klantId: number
  filename: string
  originalName: string
  bytes: number
  takenAt: string | null
  notitie: string | null
  createdAt: string
}

export interface AddFotoInput {
  klantId: number
  sourcePath: string
  originalName: string
}

interface FotoRow {
  id: number
  klantId: number
  filename: string
  originalName: string
  bytes: number
  takenAt: Date | null
  notitie: string | null
  createdAt: Date
}

// ============================================================
// Helpers
// ============================================================

function mapToRecord(row: FotoRow): FotoRecord {
  return {
    id: row.id,
    klantId: row.klantId,
    filename: row.filename,
    originalName: row.originalName,
    bytes: row.bytes,
    takenAt: row.takenAt?.toISOString() ?? null,
    notitie: row.notitie,
    createdAt: row.createdAt.toISOString()
  }
}

function safeUnlink(path: string): void {
  try {
    if (existsSync(path)) unlinkSync(path)
  } catch (err) {
    log.warn(`[fotos] Cleanup mislukt voor ${path}`, err)
  }
}

/** Lees DateTimeOriginal uit EXIF, of return null. */
async function readExifTakenAt(filePath: string): Promise<Date | null> {
  try {
    const exif = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    const date: unknown = exif?.DateTimeOriginal ?? exif?.CreateDate ?? null
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date
    }
    return null
  } catch (err) {
    log.warn('[fotos] EXIF parsing mislukt, geen takenAt', err)
    return null
  }
}

// ============================================================
// Service
// ============================================================

export class FotosService {
  /** Lijst alle foto's voor een klant, nieuwste eerst. */
  async listByKlant(klantId: number): Promise<FotoRecord[]> {
    const prisma = getDatabase()
    const rows = await prisma.foto.findMany({
      where: { klantId },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }]
    })
    return rows.map(mapToRecord)
  }

  /** Aantal foto's per klant. Voor limit-checks. */
  async countByKlant(klantId: number): Promise<number> {
    const prisma = getDatabase()
    return prisma.foto.count({ where: { klantId } })
  }

  /**
   * Validate input zonder bestand-IO. Throws bij invalid input.
   * Apart zodat we vroeg kunnen valideren in IPC.
   */
  validateAddInput(input: AddFotoInput): { ext: string; isHeic: boolean; bytes: number } {
    if (!existsSync(input.sourcePath)) {
      throw new Error(`Bronbestand bestaat niet: ${input.sourcePath}`)
    }

    const ext = extname(input.sourcePath).toLowerCase()
    if (!SUPPORTED_FOTO_EXTS.includes(ext as (typeof SUPPORTED_FOTO_EXTS)[number])) {
      throw new Error(
        `Bestandstype ${ext} wordt niet ondersteund. ` + `Gebruik JPG, PNG, HEIC of WEBP.`
      )
    }

    const stat = statSync(input.sourcePath)
    if (stat.size > FOTO_LIMITS.MAX_FILE_SIZE_BYTES) {
      const sizeMb = (stat.size / 1024 / 1024).toFixed(1)
      throw new Error(`Foto te groot: ${sizeMb}MB. Maximum is ${FOTO_LIMITS.MAX_FILE_SIZE_MB}MB.`)
    }

    return {
      ext,
      isHeic: ext === '.heic' || ext === '.heif',
      bytes: stat.size
    }
  }

  /**
   * Voeg foto toe.
   * Steps:
   * 1. Validate input (ext, file-size)
   * 2. Check klant-limiet (max 100 foto's per klant)
   * 3. EXIF takenAt lezen
   * 4. Bestand kopiëren / converteren naar klant-folder
   * 5. Thumbnail genereren
   * 6. DB-record aanmaken
   *
   * Bij faal: cleanup van bestanden om weeskinderen te voorkomen.
   */
  async add(input: AddFotoInput): Promise<FotoRecord> {
    const prisma = getDatabase()

    // 1. Valideer
    const { isHeic } = this.validateAddInput(input)

    // 2. Check klant-limiet
    const currentCount = await this.countByKlant(input.klantId)
    if (currentCount >= FOTO_LIMITS.MAX_PHOTOS_PER_KLANT) {
      throw new Error(
        `Maximum aantal foto's bereikt voor deze klant ` +
          `(${FOTO_LIMITS.MAX_PHOTOS_PER_KLANT}). Verwijder oude foto's voor je nieuwe toevoegt.`
      )
    }

    // 3. EXIF lezen (faalt silent → null)
    const takenAt = await readExifTakenAt(input.sourcePath)

    // 4. Plan paden
    const finalExt = isHeic ? '.jpg' : extname(input.sourcePath).toLowerCase()
    const filename = `${randomUUID()}${finalExt}`
    const targetPath = getKlantFotoPath(input.klantId, filename)
    const thumbPath = getKlantFotoThumbPath(input.klantId, filename)

    try {
      // 5. Kopieer of converteer bestand
      if (isHeic) {
        await sharp(input.sourcePath).jpeg({ quality: FOTO_LIMITS.JPEG_QUALITY }).toFile(targetPath)
        log.info(`[fotos] HEIC geconverteerd naar JPG voor klant ${input.klantId}`)
      } else {
        copyFileSync(input.sourcePath, targetPath)
      }

      // 6. Genereer thumbnail
      await sharp(targetPath)
        .rotate() // respecteer EXIF orientation
        .resize(FOTO_LIMITS.THUMB_SIZE_PX, FOTO_LIMITS.THUMB_SIZE_PX, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: FOTO_LIMITS.THUMB_QUALITY })
        .toFile(thumbPath)

      // 7. Bestandsgrootte (post-conversie)
      const finalBytes = statSync(targetPath).size

      // 8. Database
      const row = await prisma.foto.create({
        data: {
          klantId: input.klantId,
          filename,
          originalName: input.originalName,
          bytes: finalBytes,
          takenAt,
          notitie: null
        }
      })

      log.info(
        `[fotos] Foto toegevoegd voor klant ${input.klantId}: ${input.originalName} (${(
          finalBytes /
          1024 /
          1024
        ).toFixed(2)}MB)`
      )
      return mapToRecord(row)
    } catch (err) {
      // Cleanup wees-bestanden
      log.error('[fotos] Foto toevoegen mislukt, cleanup', err)
      safeUnlink(targetPath)
      safeUnlink(thumbPath)
      throw err
    }
  }

  /** Update notitie van een foto. */
  async updateNotitie(id: number, notitie: string | null): Promise<FotoRecord> {
    const prisma = getDatabase()
    const trimmed = notitie?.trim() || null

    if (trimmed && trimmed.length > 500) {
      throw new Error('Notitie te lang (max 500 tekens)')
    }

    const row = await prisma.foto.update({
      where: { id },
      data: { notitie: trimmed }
    })
    log.info(`[fotos] Notitie geüpdatet voor foto ${id}`)
    return mapToRecord(row)
  }

  /** Verwijder foto: zowel DB-record als bestanden. */
  async delete(id: number): Promise<void> {
    const prisma = getDatabase()
    const foto = await prisma.foto.findUniqueOrThrow({ where: { id } })

    const filePath = getKlantFotoPath(foto.klantId, foto.filename)
    const thumbPath = getKlantFotoThumbPath(foto.klantId, foto.filename)

    safeUnlink(filePath)
    safeUnlink(thumbPath)

    await prisma.foto.delete({ where: { id } })
    log.info(`[fotos] Foto verwijderd: id ${id}, klant ${foto.klantId}`)
  }
}

export const fotosService = new FotosService()
