// src/renderer/src/api/advies.ts

import type { BoekhouderAdvies } from '@shared/types'

export const adviesApi = {
  getAdviezen: (jaar: number): Promise<BoekhouderAdvies[]> => window.api.getAdviezen(jaar)
}
