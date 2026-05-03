// scripts/create-seed.mjs
import Database from 'better-sqlite3'
import fs from 'fs'

const devDb = 'dev.db'
const seedDb = 'seed.db'

if (!fs.existsSync(devDb)) {
  console.error('❌ dev.db niet gevonden')
  process.exit(1)
}

fs.copyFileSync(devDb, seedDb)
console.log('✅ dev.db gekopieerd naar seed.db')

const db = new Database(seedDb)

try {
  db.exec(`
    -- Verwijder alle gebruikersdata
    DELETE FROM FactuurRegel;
    DELETE FROM Factuur;
    DELETE FROM Transactie;
    DELETE FROM Klant;
    DELETE FROM BtwSyncLog;

    -- Reset gebruikers-instellingen (lege defaults)
    UPDATE Instelling SET value = '' WHERE key IN (
      'bedrijfsnaam', 'kvk_nummer', 'btw_nummer', 'iban',
      'adres', 'telefoon', 'email'
    );

    -- Reset auto-increment counters
    DELETE FROM sqlite_sequence WHERE name IN (
      'Factuur', 'FactuurRegel', 'Transactie', 'Klant', 'BtwSyncLog'
    );

    VACUUM;
  `)
  console.log('✅ Testdata verwijderd, instellingen leeggemaakt')
  console.log('   ✓ BtwTarief behouden')
  console.log('   ✓ betaaltermijn_dagen en is_starter behouden')
} finally {
  db.close()
}

console.log('🎉 seed.db is klaar')
