// src/renderer/src/api/belasting.ts

import type { BelastingInput, InvesteringInput } from '@shared/schemas'
import type { BelastingSchatting, InvesteringResultaat } from '@shared/types'

export const belastingApi = {
  bereken: (input: BelastingInput): Promise<BelastingSchatting> =>
    window.api.berekenBelasting(input),
  berekenInvestering: (input: InvesteringInput): Promise<InvesteringResultaat> =>
    window.api.berekenInvestering(input)
}
