// prisma/seed.ts

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { PrismaClient } from '../src/generated/prisma/client'
import { BTW_TARIEVEN_DEFAULTS } from '../src/shared/constants'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

function rekenBtw(bedragExcl: number, percentage: number) {
  const btwBedrag = Math.round(bedragExcl * (percentage / 100) * 100) / 100
  return {
    bedragExcl,
    btwBedrag,
    bedragIncl: Math.round((bedragExcl + btwBedrag) * 100) / 100
  }
}

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...')

  // === BTW Tarieven ===
  const tarieven = await Promise.all(
    BTW_TARIEVEN_DEFAULTS.map((t) =>
      prisma.btwTarief.create({
        data: {
          naam: t.naam,
          percentage: t.percentage,
          geldigVanaf: new Date(t.geldigVanaf),
          bron: 'seed'
        }
      })
    )
  )

  const hoogTarief = tarieven.find((t) => t.naam === 'Hoog tarief')
  const laagTarief = tarieven.find((t) => t.naam === 'Laag tarief')
  if (!hoogTarief || !laagTarief) {
    throw new Error('BTW-tarieven niet correct gevuld')
  }

  // === Instellingen ===
  const instellingen = [
    { key: 'bedrijfsnaam', value: 'Warmtepomp Installaties BV' },
    { key: 'kvk_nummer', value: '12345678' },
    { key: 'btw_nummer', value: 'NL123456789B01' },
    { key: 'iban', value: 'NL00 BANK 0000 0000 00' },
    { key: 'adres', value: 'Werkstraat 1, 1234 AB Plaats' },
    { key: 'telefoon', value: '06-12345678' },
    { key: 'email', value: 'info@voorbeeld.nl' },
    { key: 'betaaltermijn_dagen', value: '14' },
    { key: 'is_starter', value: 'false' }
  ]

  for (const instelling of instellingen) {
    await prisma.instelling.upsert({
      where: { key: instelling.key },
      update: { value: instelling.value },
      create: instelling
    })
  }

  // === Testdata ===
  const installatie = rekenBtw(5500, laagTarief.percentage)
  const levering = rekenBtw(3500, hoogTarief.percentage)
  const inkoop = rekenBtw(2200, hoogTarief.percentage)
  const dieselExcl = Math.round((96.8 / (1 + hoogTarief.percentage / 100)) * 100) / 100
  const dieselBtw = Math.round((96.8 - dieselExcl) * 100) / 100

  await prisma.transactie.createMany({
    data: [
      {
        type: 'inkomst',
        omschrijving: 'Installatie warmtepomp fam. De Vries',
        bedrag: 5500,
        invoerwijze: 'exclusief',
        btwTariefId: laagTarief.id,
        btwPercentage: laagTarief.percentage,
        bedragExcl: installatie.bedragExcl,
        btwBedrag: installatie.btwBedrag,
        bedragIncl: installatie.bedragIncl,
        datum: new Date('2026-04-15'),
        categorie: 'arbeid'
      },
      {
        type: 'inkomst',
        omschrijving: 'Levering Daikin Altherma 3',
        bedrag: 3500,
        invoerwijze: 'exclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: hoogTarief.percentage,
        bedragExcl: levering.bedragExcl,
        btwBedrag: levering.btwBedrag,
        bedragIncl: levering.bedragIncl,
        datum: new Date('2026-04-15'),
        categorie: 'materiaal'
      },
      {
        type: 'uitgave',
        omschrijving: 'Inkoop Daikin warmtepomp',
        bedrag: 2200,
        invoerwijze: 'exclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: hoogTarief.percentage,
        bedragExcl: inkoop.bedragExcl,
        btwBedrag: inkoop.btwBedrag,
        bedragIncl: inkoop.bedragIncl,
        datum: new Date('2026-04-10'),
        categorie: 'materiaal'
      },
      {
        type: 'uitgave',
        omschrijving: 'Diesel bestelbus',
        bedrag: 96.8,
        invoerwijze: 'inclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: hoogTarief.percentage,
        bedragExcl: dieselExcl,
        btwBedrag: dieselBtw,
        bedragIncl: 96.8,
        datum: new Date('2026-04-12'),
        categorie: 'transport'
      }
    ]
  })

  console.log('✅ Database geseeded!')
  console.log(`   ${tarieven.length} BTW-tarieven`)
  console.log(`   ${instellingen.length} instellingen`)
  console.log(`   4 test-transacties`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
