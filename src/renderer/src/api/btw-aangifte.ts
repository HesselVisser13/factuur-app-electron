// src/renderer/src/api/btw-aangifte.ts

export const btwAangifteApi = {
  genereer: (kwartaal: number, jaar: number) => window.api.getBtwAangifte(kwartaal, jaar)
}
