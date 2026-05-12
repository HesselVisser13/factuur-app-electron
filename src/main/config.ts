// src/main/config.ts

/**
 * Centrale config-loader voor environment variables.
 * Waarden worden build-time geïnjecteerd via Vite's define.
 *
 * BELANGRIJK: gebruik altijd `process.env.X` (direct property access),
 * niet `process.env[key]` (bracket notatie). Vite vervangt alleen
 * letterlijke property-access tijdens build.
 */

interface AppConfig {
  gmail: {
    clientId: string
    clientSecret: string
  }
}

export function getConfig(): AppConfig {
  return {
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID ?? '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET ?? ''
    }
  }
}

export function isMailConfigured(): boolean {
  const config = getConfig()
  return config.gmail.clientId !== '' && config.gmail.clientSecret !== ''
}
