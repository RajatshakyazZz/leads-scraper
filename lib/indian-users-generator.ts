export type GeneratedUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  plan: string;
  banned: boolean;
  status: string;
  adminNotes: string;
  leadLimit: number;
  leadsUsed: number;
  monthlyQuota: number;
  dailyQuota: number;
  customCredits: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

const FIRST_NAMES = [
  "Rahul", "Priya", "Aarav", "Rohit", "Ananya", "Aditya", "Sneha", "Vikram", "Riya", "Deepak",
  "Amit", "Neha", "Siddharth", "Kavya", "Rohan", "Pooja", "Karan", "Divya", "Manish", "Shreya",
  "Suresh", "Swati", "Rajesh", "Megha", "Varun", "Ishita", "Gaurav", "Nisha", "Abhishek", "Sonam",
  "Alok", "Tanya", "Tarun", "Anjali", "Nikhil", "Bhavna", "Yash", "Kritika", "Vivek", "Rashmi",
  "Mayank", "Simran", "Arjun", "Komal", "Saurabh", "Payal", "Rakesh", "Sonia", "Kunal", "Archana",
  "Mohit", "Jyoti", "Aakash", "Monika", "Prashant", "Vandana", "Kiran", "Nitin", "Deepika", "Sunil"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Patel", "Joshi", "Kumar", "Mehta", "Yadav", "Shah",
  "Chawla", "Reddy", "Malhotra", "Rao", "Aggarwal", "Deshmukh", "Nair", "Banerjee", "Chatterjee", "Kapoor",
  "Bhasin", "Tiwari", "Pandey", "Sinha", "Dutta", "Choudhury", "Saxena", "Bhatia", "Mishra", "Jain",
  "Goyal", "Tripathi", "Dubey", "Rathore", "Chauhan", "Dhar", "Thakur", "Narang", "Ahuja", "Bajaj"
];

function randomInt(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999 + 1) * 10000;
  const rand = x - Math.floor(x);
  return Math.floor(rand * (max - min + 1)) + min;
}

function randomAugDateIso(seed: number): string {
  // Aug 1, 2026 00:00:00 UTC = 1785542400000 ms
  // Aug 13, 2026 23:59:59 UTC = 1786665599000 ms
  const startMs = new Date("2026-08-01T00:00:00Z").getTime();
  const endMs = new Date("2026-08-13T23:59:59Z").getTime();
  
  const x = Math.sin(seed * 7777 + 3) * 10000;
  const rand = x - Math.floor(x);
  
  const randomMs = startMs + Math.floor(rand * (endMs - startMs));
  return new Date(randomMs).toISOString();
}

function generateNaturalEmail(fn: string, ln: string, seed: number): string {
  const f = fn.toLowerCase().replace(/[^a-z]/g, "");
  const l = ln.toLowerCase().replace(/[^a-z]/g, "");
  const fInit = f.charAt(0);
  const lInit = l.charAt(0);

  const num2 = randomInt(seed + 80, 11, 99);
  const birthYears = ["1993", "1995", "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003"];
  const birthYear = birthYears[randomInt(seed + 90, 0, birthYears.length - 1)];

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

export function generateIndianUsers(count = 3400): GeneratedUser[] {
  const users: GeneratedUser[] = [];
  const existingEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[randomInt(i + 1, 0, FIRST_NAMES.length - 1)];
    const ln = LAST_NAMES[randomInt(i + 100, 0, LAST_NAMES.length - 1)];

    let email = generateNaturalEmail(fn, ln, i + 500);
    if (existingEmails.has(email)) {
      email = `${fn.toLowerCase()}.${ln.toLowerCase()}${randomInt(i + 1000, 1000, 9999)}@gmail.com`;
    }
    existingEmails.add(email);

    const dateIso = randomAugDateIso(i + 200);
    const leadsScraped = randomInt(i + 300, 3, 15);
    const plan = "free"; // 100% Free users (Pro = 0)

    users.push({
      uid: `ind_usr_${String(i + 1).padStart(4, "0")}`,
      email,
      displayName: `${fn} ${ln}`,
      photoURL: null,
      plan,
      banned: false,
      status: "Active",
      adminNotes: "Aug 1-13 Indian Gmail user",
      leadLimit: 15,
      leadsUsed: leadsScraped,
      monthlyQuota: 15,
      dailyQuota: 15,
      customCredits: 0,
      createdAt: dateIso,
      updatedAt: dateIso,
      lastLoginAt: dateIso,
    });
  }

  // Sort descending by createdAt date
  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
