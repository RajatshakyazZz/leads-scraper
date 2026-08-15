const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim() : "";
  if (raw) {
    const jsonStr = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    const email = parsed.client_email || parsed.clientEmail;
    const correctedEmail = (email && email.startsWith("-adminsdk")) ? `firebase${email}` : email;
    let key = parsed.private_key || parsed.privateKey || "";
    key = key.trim().replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
    return {
      project_id: parsed.project_id || parsed.projectId,
      client_email: correctedEmail,
      private_key: key,
    };
  }

  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const correctedEmail = (email && email.startsWith("-adminsdk")) ? `firebase${email}` : email;
  let key = process.env.FIREBASE_PRIVATE_KEY || "";
  key = key.trim().replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");

  return {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: correctedEmail,
    private_key: key,
  };
}

const sa = readServiceAccount();

if (!getApps().length) {
  initializeApp({
    credential: cert(sa),
  });
}

const db = getFirestore();

const FIRST_NAMES = [
  "Rahul", "Priya", "Aarav", "Rohit", "Ananya", "Aditya", "Sneha", "Vikram", "Riya", "Deepak",
  "Amit", "Neha", "Siddharth", "Kavya", "Rohan", "Pooja", "Karan", "Divya", "Manish", "Shreya",
  "Suresh", "Swati", "Rajesh", "Megha", "Varun", "Ishita", "Gaurav", "Nisha", "Abhishek", "Sonam",
  "Alok", "Tanya", "Tarun", "Anjali", "Nikhil", "Bhavna", "Yash", "Kritika", "Vivek", "Rashmi",
  "Mayank", "Simran", "Arjun", "Komal", "Saurabh", "Payal", "Rakesh", "Sonia", "Kunal", "Archana",
  "Mohit", "Jyoti", "Aakash", "Monika", "Prashant", "Vandana", "Prashant", "Kiran", "Nitin", "Deepika"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Patel", "Joshi", "Kumar", "Mehta", "Yadav", "Shah",
  "Chawla", "Reddy", "Malhotra", "Rao", "Aggarwal", "Deshmukh", "Nair", "Banerjee", "Chatterjee", "Kapoor",
  "Bhasin", "Tiwari", "Pandey", "Sinha", "Dutta", "Choudhury", "Saxena", "Bhatia", "Mishra", "Jain",
  "Goyal", "Tripathi", "Dubey", "Rathore", "Chauhan", "Dhar", "Thakur", "Narang", "Ahuja", "Bajaj"
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAugDate() {
  const startMs = new Date("2026-08-01T00:00:00Z").getTime();
  const endMs = new Date("2026-08-13T23:59:59Z").getTime();
  const randomMs = startMs + Math.floor(Math.random() * (endMs - startMs));
  return new Date(randomMs);
}

function generateNaturalEmail(fn, ln, seed) {
  const f = fn.toLowerCase().replace(/[^a-z]/g, "");
  const l = ln.toLowerCase().replace(/[^a-z]/g, "");
  const fInit = f.charAt(0);
  const lInit = l.charAt(0);

  const num2 = randomInt(11, 99);
  const birthYears = ["1993", "1995", "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003"];
  const birthYear = birthYears[randomInt(0, birthYears.length - 1)];

  const patternType = seed % 10;

  switch (patternType) {
    case 0:
      return `${f}.${l}@gmail.com`;
    case 1:
      return `${f}${l}${num2}@gmail.com`;
    case 2:
      return `${f}_${l}@gmail.com`;
    case 3:
      return `${f}.${l}.${birthYear}@gmail.com`;
    case 4:
      return `${fInit}${l}${num2}@gmail.com`;
    case 5:
      return `${f}${lInit}${num2}@gmail.com`;
    case 6:
      return `${f}${l}${birthYear}@gmail.com`;
    case 7:
      return `${f}.${l}.work@gmail.com`;
    case 8:
      return `iam.${f}${l}@gmail.com`;
    case 9:
      return `${f}_${l}${num2}@gmail.com`;
    default:
      return `${f}.${l}${num2}@gmail.com`;
  }
}

async function seed() {
  console.log("🚀 Starting seeding 3,400 Indian Gmail users into Cloud Firestore...");
  const TOTAL_USERS = 3400;
  const BATCH_SIZE = 425;
  let createdCount = 0;
  const existingEmails = new Set();

  for (let batchIdx = 0; batchIdx < 8; batchIdx++) {
    const batch = db.batch();

    for (let i = 0; i < BATCH_SIZE; i++) {
      const fn = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
      const ln = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
      
      let email = generateNaturalEmail(fn, ln, i + batchIdx * 500);
      if (existingEmails.has(email)) {
        email = `${fn.toLowerCase()}.${ln.toLowerCase()}${randomInt(1000, 9999)}@gmail.com`;
      }
      existingEmails.add(email);

      const uid = `ind_usr_${Date.now()}_${batchIdx}_${i}`;
      const ref = db.collection("users").doc(uid);

      const signupDate = randomAugDate();
      const leadsScraped = randomInt(3, 15);
      const plan = "free";

      const userData = {
        uid,
        email,
        displayName: `${fn} ${ln}`,
        photoURL: null,
        plan,
        banned: false,
        status: "Active",
        leadLimit: 15,
        leadsUsed: leadsScraped,
        monthlyQuota: 15,
        dailyQuota: 15,
        customCredits: 0,
        adminNotes: "Aug 1-13 Indian Gmail user",
        createdAt: signupDate,
        updatedAt: signupDate,
        lastLoginAt: signupDate,
      };

      batch.set(ref, userData);
      createdCount++;
    }

    await batch.commit();
    console.log(`✅ Batch ${batchIdx + 1}/8 committed (${createdCount}/${TOTAL_USERS} users created)`);
  }

  console.log(`🎉 SUCCESS: Created all ${createdCount} Indian Gmail users in Cloud Firestore!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
