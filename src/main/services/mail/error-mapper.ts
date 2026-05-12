// src/main/services/mail/error-mapper.ts

/**
 * Vertaalt ruwe Gmail/Network-errors naar mensvriendelijke meldingen.
 * Behoudt de originele error voor logging-doeleinden.
 */

interface MaybeError {
  message?: string
  code?: string | number
  errors?: Array<{ message?: string; reason?: string }>
}

export function getReadableMailError(err: unknown): string {
  const e = err as MaybeError
  const message = e?.message ?? ''
  const code = String(e?.code ?? '')

  // Netwerk-fouten
  if (
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('EAI_AGAIN') ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT'
  ) {
    return 'Geen internetverbinding. Controleer je verbinding en probeer het opnieuw.'
  }

  // OAuth: ongeldige/vervallen tokens
  if (message.includes('invalid_grant') || message.includes('Token has been expired or revoked')) {
    return (
      'De Gmail-verbinding is verlopen. ' +
      'Ga naar Instellingen → Mail en verbind je account opnieuw.'
    )
  }

  if (message.includes('invalid_request') || message.includes('invalid_client')) {
    return (
      'Mail-configuratie is niet geldig. ' +
      'Verbreek de Gmail-verbinding en verbind opnieuw via Instellingen.'
    )
  }

  // Quota / rate limits
  if (
    message.includes('Quota exceeded') ||
    message.includes('rate limit') ||
    message.includes('Too Many Requests')
  ) {
    return 'Verzendlimiet bereikt. Probeer het over een paar minuten opnieuw.'
  }

  // Permissies
  if (message.includes('insufficient authentication scopes')) {
    return (
      'Onvoldoende rechten voor Gmail. ' +
      'Verbreek de verbinding en verbind opnieuw via Instellingen → Mail.'
    )
  }

  // Ongeldig e-mailadres (Gmail valideert ook server-side)
  if (message.includes('Invalid To header') || message.includes('Recipient address rejected')) {
    return 'Het e-mailadres van de ontvanger is niet geldig.'
  }

  // Bijlage-grootte
  if (message.includes('Message size exceeds') || message.includes('size limit')) {
    return 'De factuur is te groot om te versturen (limiet: 25 MB).'
  }

  // Fallback: originele message tonen, maar zonder stack trace
  if (message) {
    return `Mail kon niet worden verzonden: ${message}`
  }

  return 'Er ging iets mis bij het versturen. Probeer het opnieuw.'
}
