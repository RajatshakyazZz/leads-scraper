import "server-only";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAugDate(): Date {
  // Aug 1, 2026 00:00:00 UTC to Aug 13, 2026 23:59:59 UTC
  const startMs = new Date("2026-08-01T00:00:00Z").getTime();
  const endMs = new Date("2026-08-13T23:59:59Z").getTime();
  const randomMs = startMs + Math.floor(Math.random() * (endMs - startMs));
  return new Date(randomMs);
}

async function seedUsers() {
  const db = getAdminDb();
  const TOTAL_USERS = 3400;
  const BATCH_SIZE = 425; // 8 batches of 425 = 3400 users

  let createdCount = 0;
  const existingEmails = new Set<string>();

  for (let batchIdx = 0; batchIdx < 8; batchIdx++) {
    const batch = db.batch();

    for (let i = 0; i < BATCH_SIZE; i++) {
      const fn = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
      const ln = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
      const num = randomInt(10, 999);
      
      let email = `${fn.toLowerCase()}.${ln.toLowerCase()}${num}@gmail.com`;
      if (existingEmails.has(email)) {
        email = `${fn.toLowerCase()}${ln.toLowerCase()}${randomInt(1000, 9999)}@gmail.com`;
      }
      existingEmails.add(email);

      const uid = `ind_usr_${Date.now()}_${batchIdx}_${i}`;
      const ref = db.collection("users").doc(uid);

      const signupDate = randomAugDate();
      const leadsScraped = randomInt(3, 15);
      const plan = randomInt(1, 100) > 95 ? "pro" : "free";

      const userData = {
        uid,
        email,
        displayName: `${fn} ${ln}`,
        photoURL: null,
        plan,
        banned: false,
        status: "Active",
        leadLimit: plan === "pro" ? 100 : 15,
        leadsUsed: leadsScraped,
        monthlyQuota: plan === "pro" ? 100 : 15,
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
    console.log(`Batch ${batchIdx + 1}/8 committed (${createdCount} users created)`);
  }

  return createdCount;
}

export async function GET() {
  try {
    const createdCount = await seedUsers();
    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCount} Indian Gmail users in Firebase Firestore!`,
      totalCreated: createdCount,
    });
  } catch (error) {
    console.error("Error seeding users:", error);
    return NextResponse.json({ code: "SEED_ERROR", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const createdCount = await seedUsers();
    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCount} Indian Gmail users in Firebase Firestore!`,
      totalCreated: createdCount,
    });
  } catch (error) {
    console.error("Error seeding users:", error);
    return NextResponse.json({ code: "SEED_ERROR", error: (error as Error).message }, { status: 500 });
  }
}
