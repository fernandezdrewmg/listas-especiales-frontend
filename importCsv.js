// importCsv.js
const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COLLECTION = "listas_especiales";
const CSV_FILE   = "./data.csv";
const BATCH_SIZE = 200;       // Menos documentos por lote
const PAUSE_MS   = 200;       // Pausa de 200ms entre lotes

// Función para pausar
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function runImport() {
  // 1. Lee todo el CSV
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });
  console.log(`✅ CSV leído: ${rows.length} filas.`);

  // 2. Importa en lotes
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = rows.slice(i, i + BATCH_SIZE);

    slice.forEach(row => {
      const ref = db.collection(COLLECTION).doc();
      batch.set(ref, row);
    });

    try {
      await batch.commit();
      console.log(`   ➤ Lote ${i/BATCH_SIZE + 1}: ${slice.length} docs importados.`);
    } catch (err) {
      console.error(`❌ Error en lote ${i/BATCH_SIZE + 1}:`, err);
      // Decide si abortas o continúas
      // process.exit(1);
    }

    // Pausa antes de siguiente lote
    await sleep(PAUSE_MS);
  }

  console.log("🎉 Importación completada.");
}

runImport()
  .catch(err => {
    console.error("Error general importCsv:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
