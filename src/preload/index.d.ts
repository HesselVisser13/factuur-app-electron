// src/preload/index.d.ts

import type { Api } from './index'

declare global {
  interface Window {
    api: Api
  }
}
