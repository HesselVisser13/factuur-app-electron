// src/renderer/src/utils/pluralize.ts

export function facturenLabel(aantal: number): string {
  return `${aantal} factu${aantal === 1 ? 'ur' : 'ren'}`
}
