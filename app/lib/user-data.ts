import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebase-admin";
import type { Lead, SavedPrompt, ScrapeInput } from "@/lib/types";

type FirestoreTimestampValue = Timestamp | { toDate?: () => Date } | string | null | undefined;

const LEAD_FIELDS: Array<keyof Lead> = [
  "sourceLeadId",
  "name",
  "category",
  "address",
  "city",
  "phone",
  "whatsapp",
  "email",
  "website",
  "rating",
  "reviewsCount",
  "lat",
  "lng",
  "photosCount",
  "yearsInBusiness",
];

function timestampToIso(value: FirestoreTimestampValue) {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "object" && typeof value.toDate === "function") return value.toDate().toISOString();
  return typeof value === "string" ? value : undefined;
}

function cleanObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== "")) as Partial<T>;
}

function serializeLead(id: string, data: DocumentData): Lead {
  return {
    id,
    sourceLeadId: typeof data.sourceLeadId === "string" ? data.sourceLeadId : undefined,
    name: String(data.name ?? "Unknown"),
    category: String(data.category ?? ""),
    address: String(data.address ?? ""),
    city: String(data.city ?? ""),
    phone: typeof data.phone === "string" ? data.phone : undefined,
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    website: typeof data.website === "string" ? data.website : undefined,
    rating: typeof data.rating === "number" ? data.rating : undefined,
    reviewsCount: typeof data.reviewsCount === "number" ? data.reviewsCount : undefined,
    lat: typeof data.lat === "number" ? data.lat : 19.06,
    lng: typeof data.lng === "number" ? data.lng : 72.83,
    photosCount: typeof data.photosCount === "number" ? data.photosCount : undefined,
    yearsInBusiness: typeof data.yearsInBusiness === "number" ? data.yearsInBusiness : undefined,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function saveScrapedLeads(uid: string, leads: Lead[], input: ScrapeInput, source: string) {
  if (leads.length === 0) return [];

  const db = getAdminDb();
  const batch = db.batch();
  const saved: Lead[] = [];

  for (const lead of leads) {
    const ref = db.collection("users").doc(uid).collection("leads").doc();
    const leadData = cleanObject({
      sourceLeadId: lead.sourceLeadId ?? lead.id,
      name: lead.name,
      category: lead.category,
      address: lead.address,
      city: lead.city,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      website: lead.website,
      rating: lead.rating,
      reviewsCount: lead.reviewsCount,
      lat: lead.lat,
      lng: lead.lng,
      photosCount: lead.photosCount,
      yearsInBusiness: lead.yearsInBusiness,
      scrapeNiche: input.niche,
      scrapeCity: input.city,
      scrapeSource: source,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.set(ref, leadData);
    saved.push({ ...lead, id: ref.id, sourceLeadId: lead.sourceLeadId ?? lead.id });
  }

  await batch.commit();
  return saved;
}

export async function getSavedLeads(uid: string) {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("leads")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();

  return snap.docs.map((doc) => serializeLead(doc.id, doc.data()));
}

export async function saveWebsitePrompt(uid: string, input: { lead: Lead; platform: string; prompt: string }) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid).collection("prompts").doc();
  const data = {
    leadId: input.lead.id,
    leadName: input.lead.name,
    platform: input.platform,
    prompt: input.prompt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(data);

  return {
    id: ref.id,
    leadId: data.leadId,
    leadName: data.leadName,
    platform: data.platform,
    prompt: data.prompt,
  } satisfies SavedPrompt;
}

export async function getSavedPrompts(uid: string) {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("prompts")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      leadId: String(data.leadId ?? ""),
      leadName: String(data.leadName ?? ""),
      platform: String(data.platform ?? ""),
      prompt: String(data.prompt ?? ""),
      createdAt: timestampToIso(data.createdAt),
      updatedAt: timestampToIso(data.updatedAt),
    } satisfies SavedPrompt;
  });
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function leadsToCsv(leads: Lead[]) {
  const headers: Array<keyof Lead | "mapsUrl"> = [
    "name",
    "category",
    "address",
    "city",
    "phone",
    "whatsapp",
    "email",
    "website",
    "rating",
    "reviewsCount",
    "lat",
    "lng",
    "photosCount",
    "createdAt",
    "mapsUrl",
  ];

  const rows = leads.map((lead) => {
    const record: Record<string, unknown> = {};
    for (const field of LEAD_FIELDS) record[field] = lead[field];
    record.createdAt = lead.createdAt;
    record.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address}`)}`;
    return headers.map((header) => escapeCsv(record[header])).join(",");
  });

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export async function uploadCsvExport(uid: string, csv: string) {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;

  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const file = getAdminStorageBucket(bucketName).file(`users/${uid}/exports/leads-${date}.csv`);

  await file.save(csv, {
    contentType: "text/csv; charset=utf-8",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=0, no-transform",
    },
  });

  return file.name;
}
