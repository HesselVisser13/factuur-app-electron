// src/renderer/src/utils/foto.ts

/**
 * Format bytes als leesbare string (KB / MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * URL voor foto via custom protocol.
 */
export function getFotoUrl(klantId: number, filename: string): string {
  return `app-foto://klant-${klantId}/${encodeURIComponent(filename)}`
}

/**
 * URL voor thumbnail via custom protocol.
 */
export function getFotoThumbUrl(klantId: number, filename: string): string {
  return `app-foto://klant-${klantId}/.thumbs/${encodeURIComponent(filename)}`
}

/**
 * Haalt bestandspaden uit gedropte Files (Electron-specifiek).
 * Werkt alleen voor échte File-objects uit drag/drop in Electron.
 */
export function getPathsFromDropEvent(e: React.DragEvent): string[] {
  const files = Array.from(e.dataTransfer.files)
  const paths: string[] = []
  for (const file of files) {
    try {
      const path = window.api.getPathForFile(file)
      if (path) paths.push(path)
    } catch {
      // file.path niet beschikbaar (bv. browser, niet Electron)
    }
  }
  return paths
}
