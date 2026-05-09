// src/renderer/src/utils/inputClasses.ts

export const INPUT_BASE = 'w-full border rounded-lg px-4 py-2 text-sm disabled:bg-gray-50'
export const INPUT_BASE_SMALL = 'w-full border rounded px-2 py-1 text-sm disabled:bg-gray-100'

export function inputClasses(hasError: boolean, base: string = INPUT_BASE): string {
  return `${base} ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
}
