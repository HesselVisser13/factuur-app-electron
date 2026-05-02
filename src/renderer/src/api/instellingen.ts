// src/renderer/src/api/instellingen.ts

export const instellingenApi = {
  getAll: () => window.api.getInstellingen(),
  save: (data: Record<string, string>) => window.api.saveInstellingen(data),
  selectLogo: () => window.api.selectLogo()
}
