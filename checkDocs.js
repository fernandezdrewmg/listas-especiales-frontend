// checkDocs.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  const snapshot = await db.collection("listas_especiales").get();
  console.log(`Encontrados ${snapshot.size} documentos:\n`);
  snapshot.forEach(doc => {
    console.log("ID:", doc.id);
    console.log("Datos:", doc.data());
    console.log("—".repeat(20));
  });
  process.exit();
})().catch(console.error);
