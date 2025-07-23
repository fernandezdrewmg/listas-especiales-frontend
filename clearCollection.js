// clearCollection.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const COLLECTION  = "listas_especiales";
const BATCH_SIZE  = 50;       // Menos lecturas por lote
const PAUSE_MS    = 1000;     // 1 s de pausa entre lotes
const MAX_RETRIES = 5;        // Reintentos ante error

// Pausa sencilla
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Función para procesar un solo lote
async function processBatch() {
  const snapshot = await db
    .collection(COLLECTION)
    .limit(BATCH_SIZE)
    .get();

  if (snapshot.empty) {
    return false; // No quedan docs
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🗑️ Borrados ${snapshot.size} documentos.`);
  return true;
}

async function clearCollection() {
  let keepGoing = true;
  let attempt   = 0;

  while (keepGoing) {
    try {
      keepGoing = await processBatch();
      attempt    = 0;           // reset de reintentos
      await sleep(PAUSE_MS);    // espera entre lotes
    } catch (err) {
      attempt++;
      console.error(`❌ Error borrando lote (intent ${attempt}):`, err.message);

      if (attempt >= MAX_RETRIES) {
        console.error("🚫 Límite de reintentos alcanzado. Abortando.");
        process.exit(1);
      }
      // Backoff progresivo
      const backoff = PAUSE_MS * attempt;
      console.log(`⏳ Reintentando en ${backoff} ms...`);
      await sleep(backoff);
    }
  }

  console.log("✅ Colección vaciada completamente.");
  process.exit(0);
}

clearCollection();
