// src/main/services/advies.service.ts

import { getDatabase } from '../db/client'
import { log } from '../logger'
import { OMZET_STATUSSEN, OPENSTAAND_STATUSSEN } from '../../shared/constants'

export interface BoekhouderAdvies {
  id: string
  type: 'tip' | 'waarschuwing' | 'actie' | 'succes'
  titel: string
  bericht: string
  actieLabel?: string
  actieRoute?: string
}

export class AdviesService {
  private formatBedrag(bedrag: number): string {
    return bedrag.toLocaleString('nl-NL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  async getAdviezen(jaar: number): Promise<BoekhouderAdvies[]> {
    const adviezen: BoekhouderAdvies[] = []
    const prisma = getDatabase()

    const startJaar = new Date(jaar, 0, 1)
    const eindJaar = new Date(jaar, 11, 31, 23, 59, 59)

    const [facturen, uitgaven] = await Promise.all([
      prisma.factuur.findMany({
        where: { datum: { gte: startJaar, lte: eindJaar } }
      }),
      prisma.transactie.findMany({
        where: {
          datum: { gte: startJaar, lte: eindJaar },
          type: 'uitgave'
        }
      })
    ])

    const totaleOmzetExcl = facturen
      .filter((f) => OMZET_STATUSSEN.includes(f.status as (typeof OMZET_STATUSSEN)[number]))
      .reduce((sum, f) => sum + f.totaalExcl, 0)

    const totaleUitgavenExcl = uitgaven.reduce((sum, u) => sum + u.bedragExcl, 0)
    const winstExcl = totaleOmzetExcl - totaleUitgavenExcl

    const investeringsCategorieen = ['inventaris', 'gereedschap', 'apparatuur', 'machines']
    const investeringenExcl = uitgaven
      .filter((u) => u.categorie && investeringsCategorieen.includes(u.categorie.toLowerCase()))
      .reduce((sum, u) => sum + u.bedragExcl, 0)

    const KIA_DREMPEL = 2801
    if (investeringenExcl > 1000 && investeringenExcl < KIA_DREMPEL) {
      const tekort = KIA_DREMPEL - investeringenExcl
      adviezen.push({
        id: 'kia_waarschuwing',
        type: 'tip',
        titel: 'Investeringsaftrek (KIA) in zicht!',
        bericht: `Je hebt dit jaar voor € ${this.formatBedrag(investeringenExcl)} geïnvesteerd. Als je nog voor € ${this.formatBedrag(tekort)} aan zakelijke middelen (bijv. gereedschap of laptop) koopt, mag je een extra percentage van je winst aftrekken!`,
        actieLabel: 'Bekijk uitgaven',
        actieRoute: '/transacties'
      })
    }

    const KOR_DREMPEL = 20000
    if (totaleOmzetExcl > 15000 && totaleOmzetExcl < KOR_DREMPEL) {
      const ruimte = KOR_DREMPEL - totaleOmzetExcl
      adviezen.push({
        id: 'kor_waarschuwing',
        type: 'waarschuwing',
        titel: `Let op de KOR grens (Omzet: € ${this.formatBedrag(KOR_DREMPEL)})`,
        bericht: `Je omzet is nu € ${this.formatBedrag(totaleOmzetExcl)}. Je hebt nog € ${this.formatBedrag(ruimte)} over tot de grens. Ga je hier overheen? Dan moet je BTW gaan rekenen en afdragen.`
      })
    }

    if (winstExcl > 30000) {
      const buffer = winstExcl * 0.3 // Ruwe schatting 30% reservering
      adviezen.push({
        id: 'hoge_winst_ib',
        type: 'actie',
        titel: 'Hoge winst gespot',
        bericht: `Je winst staat op € ${this.formatBedrag(winstExcl)}. Vergeet niet om zo'n € ${this.formatBedrag(buffer)} opzij te zetten voor de inkomstenbelasting. Of doe slimme zakelijke aankopen om je winst te drukken.`,
        actieLabel: 'Naar Cashflow',
        actieRoute: '/cashflow'
      })
    }

    const nu = new Date()
    const openstaandeFacturen = facturen.filter(
      (f) =>
        OPENSTAAND_STATUSSEN.includes(f.status as (typeof OPENSTAAND_STATUSSEN)[number]) &&
        f.vervalDatum < nu
    )

    if (openstaandeFacturen.length > 0) {
      adviezen.push({
        id: 'facturen_vervallen',
        type: 'actie',
        titel: 'Geld laten liggen?',
        bericht: `Je hebt ${openstaandeFacturen.length} factur(en) waarvan de betaaltermijn is verstreken. Tijd om een herinnering te sturen!`,
        actieLabel: 'Bekijk facturen',
        actieRoute: '/facturen'
      })
    }

    if (adviezen.length === 0) {
      adviezen.push({
        id: 'alles_goed',
        type: 'succes',
        titel: 'Alles ziet er goed uit!',
        bericht: 'Je financiën zijn momenteel netjes in balans. Geen actie vereist.'
      })
    }

    log.info(`[advies] ${adviezen.length} adviezen gegenereerd voor jaar ${jaar}`)
    return adviezen
  }
}

export const adviesService = new AdviesService()
