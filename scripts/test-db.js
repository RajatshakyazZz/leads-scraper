const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  try {
    initializeApp();
  } catch (e) {
    console.error("App init error:", e.message);
  }
}

async function test() {
  const db = getFirestore();
  const snap = await db.collection("users").limit(1).get();
  console.log("Docs found:", snap.size);
}

test().catch(console.error);
