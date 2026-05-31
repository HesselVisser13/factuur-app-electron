// src/renderer/src/api/belasting.ts

import type { BelastingInput } from '@shared/schemas'
import type { BelastingSchatting } from '@shared/types'

export const belastingApi = {
  bereken: (input: BelastingInput): Promise<BelastingSchatting> =>
    window.api.berekenBelasting(input)
}
