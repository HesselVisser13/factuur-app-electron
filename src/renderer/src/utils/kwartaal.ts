// src/renderer/src/utils/kwartaal.ts

export interface Kwartaal {
  kwartaal: number
  jaar: number
}

export function getHuidigKwartaal(date: Date = new Date()): Kwartaal {
  return {
    kwartaal: Math.floor(date.getMonth() / 3) + 1,
    jaar: date.getFullYear()
  }
}
