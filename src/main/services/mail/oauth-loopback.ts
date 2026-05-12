// src/main/services/mail/oauth-loopback.ts

import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { shell } from 'electron'
import { OAuth2Client } from 'google-auth-library'
import { randomBytes } from 'crypto'
import { getReadableMailError } from './error-mapper'

import { log } from '../../logger'

const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'openid', 'email']

const AUTH_TIMEOUT_MS = 5 * 60 * 1000 // 5 min

interface AuthResult {
  refreshToken: string
  accessToken: string
  email: string
}

interface OAuthConfig {
  clientId: string
  clientSecret: string
}

/**
 * Voert volledige OAuth Loopback flow uit:
 * 1. Start tijdelijke localhost server
 * 2. Opent default browser met Google login
 * 3. Vangt redirect af, ruilt code in voor tokens
 * 4. Haalt email-adres op via UserInfo
 * 5. Sluit server, retourneert tokens + email
 */
export async function runOAuthFlow(config: OAuthConfig): Promise<AuthResult> {
  const state = randomBytes(32).toString('hex')

  return new Promise((resolve, reject) => {
    let server: Server | null = null
    let timeoutId: NodeJS.Timeout | null = null

    const cleanup = (): void => {
      if (timeoutId) clearTimeout(timeoutId)
      if (server) server.close()
    }

    server = createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.writeHead(400)
          res.end('Bad request')
          return
        }

        const url = new URL(req.url, `http://127.0.0.1`)
        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(renderHtmlPage('Verbinden mislukt', `Google gaf een fout terug: ${error}`, true))
          cleanup()
          reject(new Error(`OAuth error: ${error}`))
          return
        }

        if (!code) {
          res.writeHead(400)
          res.end('Geen code ontvangen')
          return
        }

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(renderHtmlPage('Beveiligingsfout', 'State-parameter klopt niet.', true))
          cleanup()
          reject(new Error('State mismatch'))
          return
        }

        // Listening adres ophalen voor redirect_uri match
        const address = server!.address() as AddressInfo
        const redirectUri = `http://127.0.0.1:${address.port}`

        const oauth2Client = new OAuth2Client(config.clientId, config.clientSecret, redirectUri)
        const { tokens } = await oauth2Client.getToken(code)

        if (!tokens.refresh_token) {
          throw new Error(
            'Geen refresh_token ontvangen. Mogelijk is de app eerder al geautoriseerd. ' +
              'Verwijder de app uit https://myaccount.google.com/permissions en probeer opnieuw.'
          )
        }
        if (!tokens.access_token) {
          throw new Error('Geen access_token ontvangen')
        }

        oauth2Client.setCredentials(tokens)

        // Email ophalen via UserInfo
        const email = await fetchUserEmail(tokens.access_token)

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(
          renderHtmlPage(
            'Verbonden! 🎉',
            `Je Gmail-account ${email} is gekoppeld. Je kunt dit tabblad sluiten.`,
            false
          )
        )

        cleanup()
        resolve({
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          email
        })
      } catch (err) {
        log.error('[mail] OAuth callback error', err)
        const readable = getReadableMailError(err)
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(renderHtmlPage('Verbinding mislukt', readable, true))
        cleanup()
        reject(new Error(readable))
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server!.address() as AddressInfo
      const redirectUri = `http://127.0.0.1:${address.port}`

      const oauth2Client = new OAuth2Client(config.clientId, config.clientSecret, redirectUri)
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // forceer refresh_token
        scope: SCOPES,
        state
      })

      log.info(`[mail] OAuth server luistert op ${redirectUri}`)
      log.info('[mail] Browser openen voor authenticatie...')
      void shell.openExternal(authUrl)
    })

    server.on('error', (err) => {
      cleanup()
      reject(err)
    })

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Authenticatie afgebroken: time-out na 5 minuten'))
    }, AUTH_TIMEOUT_MS)
  })
}

async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    throw new Error(`UserInfo call mislukt: ${response.status}`)
  }
  const data = (await response.json()) as { email?: string }
  if (!data.email) {
    throw new Error('Geen email-adres ontvangen van Google')
  }
  return data.email
}

function renderHtmlPage(title: string, message: string, isError: boolean): string {
  const color = isError ? '#dc2626' : '#16a34a'
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 4rem 2rem; text-align: center; color: #1f2937; }
    h1 { color: ${color}; }
    p { font-size: 1.125rem; color: #4b5563; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`
}
