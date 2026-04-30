// prisma/seed.ts

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function seed() {
  console.log('🌱 Seeding database...')

  // === BTW Tarieven ===
  const tarieven = await Promise.all([
    prisma.btwTarief.create({
      data: {
        naam: 'Hoog tarief',
        percentage: 21,
        geldigVanaf: new Date('2012-10-01'),
        bron: 'seed'
      }
    }),
    prisma.btwTarief.create({
      data: {
        naam: 'Laag tarief',
        percentage: 9,
        geldigVanaf: new Date('2019-01-01'),
        bron: 'seed'
      }
    }),
    prisma.btwTarief.create({
      data: {
        naam: 'Vrijgesteld',
        percentage: 0,
        geldigVanaf: new Date('2001-01-01'),
        bron: 'seed'
      }
    })
  ])

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
  const hoogTarief = tarieven[0]
  const laagTarief = tarieven[1]

  await prisma.transactie.createMany({
    data: [
      {
        type: 'inkomst',
        omschrijving: 'Installatie warmtepomp fam. De Vries',
        bedrag: 5500,
        invoerwijze: 'exclusief',
        btwTariefId: laagTarief.id,
        btwPercentage: 9,
        bedragExcl: 5500,
        btwBedrag: 495,
        bedragIncl: 5995,
        datum: new Date('2026-04-15'),
        categorie: 'arbeid'
      },
      {
        type: 'inkomst',
        omschrijving: 'Levering Daikin Altherma 3',
        bedrag: 3500,
        invoerwijze: 'exclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: 21,
        bedragExcl: 3500,
        btwBedrag: 735,
        bedragIncl: 4235,
        datum: new Date('2026-04-15'),
        categorie: 'materiaal'
      },
      {
        type: 'uitgave',
        omschrijving: 'Inkoop Daikin warmtepomp',
        bedrag: 2200,
        invoerwijze: 'exclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: 21,
        bedragExcl: 2200,
        btwBedrag: 462,
        bedragIncl: 2662,
        datum: new Date('2026-04-10'),
        categorie: 'materiaal'
      },
      {
        type: 'uitgave',
        omschrijving: 'Diesel bestelbus',
        bedrag: 96.8,
        invoerwijze: 'inclusief',
        btwTariefId: hoogTarief.id,
        btwPercentage: 21,
        bedragExcl: 80,
        btwBedrag: 16.8,
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
