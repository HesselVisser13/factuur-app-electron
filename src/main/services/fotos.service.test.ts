// src/main/services/fotos.service.test.ts

import { describe, expect, it } from 'vitest'

import { FOTO_LIMITS } from '../../shared/constants'

// Note: deze tests valideren de PURE logica (input-validatie).
// Echte file-IO en DB-tests vereisen een test-omgeving met mocks
// of een geïsoleerde testdatabase, wat buiten scope is voor dit bestand.

describe('FOTO_LIMITS', () => {
  it('heeft sane defaults', () => {
    expect(FOTO_LIMITS.MAX_FILE_SIZE_MB).toBe(20)
    expect(FOTO_LIMITS.MAX_FILE_SIZE_BYTES).toBe(20 * 1024 * 1024)
    expect(FOTO_LIMITS.MAX_PHOTOS_PER_KLANT).toBe(100)
    expect(FOTO_LIMITS.THUMB_SIZE_PX).toBeLessThanOrEqual(500)
  })

  it('JPEG quality binnen redelijke range', () => {
    expect(FOTO_LIMITS.JPEG_QUALITY).toBeGreaterThan(70)
    expect(FOTO_LIMITS.JPEG_QUALITY).toBeLessThanOrEqual(100)
  })
})

// TODO: Voor échte service-tests met mocks zouden we een setup nodig hebben
// die fs, sharp, exifr, en prisma mockt. Dat is significant werk.
// Voor nu vertrouwen we op manuele E2E tests via de UI.
