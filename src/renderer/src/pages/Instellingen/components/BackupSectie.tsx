// src/renderer/src/pages/Instellingen/components/BackupSectie.tsx

import { AlertTriangle, Database, Download, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

import { backupApi } from '@renderer/api'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/Toast'
import { formatDate } from '@renderer/utils/formatters'
import type { BackupManifest } from '@shared/types'

export function BackupSectie() {
  const toast = useToast()
  const confirm = useConfirm()

  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null)

  // ============================================================
  // Backup maken
  // ============================================================
  const handleCreateBackup = async (): Promise<void> => {
    if (busy !== null) return

    try {
      const targetPath = await backupApi.pickSaveLocation()
      if (!targetPath) return

      setBusy('backup')
      const result = await backupApi.create(targetPath)

      const sizeMb = (result.bytes / 1024 / 1024).toFixed(1)
      toast.success(`Backup gemaakt (${sizeMb} MB)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Backup mislukt')
    } finally {
      setBusy(null)
    }
  }

  // ============================================================
  // Backup herstellen
  // ============================================================
  const handleRestoreBackup = async (): Promise<void> => {
    if (busy !== null) return

    try {
      const zipPath = await backupApi.pickOpenLocation()
      if (!zipPath) return

      // Stap 1: inspecteer backup voor preview
      let manifest: BackupManifest
      try {
        manifest = await backupApi.inspect(zipPath)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Backup ongeldig')
        return
      }

      // Stap 2: confirm met preview
      const confirmMessage = buildRestoreConfirmMessage(manifest)
      const ok = await confirm({
        title: 'Backup herstellen?',
        message: confirmMessage,
        variant: 'danger',
        confirmText: 'Herstellen',
        cancelText: 'Annuleren'
      })
      if (!ok) return

      // Stap 3: extra waarschuwing
      const finalOk = await confirm({
        title: 'Weet je het zeker?',
        message:
          'ALLE huidige data wordt vervangen door de backup.\n\n' +
          'De app start automatisch opnieuw op na restore.\n\n' +
          'Een safety-backup van de huidige data wordt eerst gemaakt; bij ' +
          'een fout wordt automatisch teruggerold.',
        variant: 'danger',
        confirmText: 'Ja, herstel',
        cancelText: 'Annuleren'
      })
      if (!finalOk) return

      // Stap 4: restore + relaunch
      setBusy('restore')
      await backupApi.restore(zipPath)
      toast.success('Backup hersteld — app herstart...')

      // Geef toast even tijd om zichtbaar te zijn
      setTimeout(() => {
        backupApi.relaunch()
      }, 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Restore mislukt')
      setBusy(null)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Database className="w-4 h-4" aria-hidden="true" />
        Backup
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Maak regelmatig een backup om je administratie te beveiligen tegen dataverlies. Bewaar de
        backup op een externe locatie zoals een USB-stick of cloud-folder (OneDrive, Dropbox).
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <strong>Tip:</strong> sla je backup op in een gesynchroniseerde cloud-folder (zoals
          OneDrive) zodat hij ook in de cloud staat. Bij PC-crash kun je dan vanaf elke nieuwe PC
          herstellen.
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={busy !== null}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {busy === 'backup' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Backup maken...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" aria-hidden="true" />
              Backup maken
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleRestoreBackup}
          disabled={busy !== null}
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {busy === 'restore' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Herstellen...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" aria-hidden="true" />
              Backup herstellen
            </>
          )}
        </button>
      </div>
    </section>
  )
}

function buildRestoreConfirmMessage(manifest: BackupManifest): string {
  const datum = formatDate(manifest.createdAt)
  const c = manifest.contents

  const items = [
    `${c.klanten} ${c.klanten === 1 ? 'klant' : 'klanten'}`,
    `${c.facturen} ${c.facturen === 1 ? 'factuur' : 'facturen'}`,
    `${c.transacties} ${c.transacties === 1 ? 'transactie' : 'transacties'}`,
    `${c.fotos} foto's`,
    `${c.factuurPdfs} factuur-PDF's`
  ]
  if (c.hasLogo) items.push('logo')

  return (
    `Backup-info:\n` +
    `• Datum: ${datum}\n` +
    `• App-versie: ${manifest.appVersion}\n` +
    `• Inhoud: ${items.join(', ')}\n\n` +
    `LET OP: deze actie vervangt al je huidige data.`
  )
}
