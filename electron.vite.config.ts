import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: {
          '@shared': resolve('src/shared')
        }
      },
      define: {
        'process.env.GMAIL_CLIENT_ID': JSON.stringify(env.GMAIL_CLIENT_ID ?? ''),
        'process.env.GMAIL_CLIENT_SECRET': JSON.stringify(env.GMAIL_CLIENT_SECRET ?? '')
      },
      build: {
        rollupOptions: {
          external: [
            'better-sqlite3',
            '@prisma/adapter-better-sqlite3',
            'adm-zip',
            'sharp',
            'exifr'
          ]
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@shared': resolve('src/shared')
        }
      },
      plugins: [react(), tailwindcss()]
    }
  }
})
