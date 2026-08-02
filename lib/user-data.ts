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

export function leadsToCsv(leads: Lead[], audits?: Record<string, any>, rankings?: Record<string, any>, builds?: Record<string, any>, outreach?: Record<string, any>, metadata?: Record<string, any>) {
  const headers = [
    "Session ID",
    "Search Niche",
    "Search City",
    "Business Name",
    "Category",
    "Address",
    "City",
    "Phone",
    "WhatsApp",
    "Email",
    "Website",
    "Rating",
    "Reviews Count",
    "Latitude",
    "Longitude",
    "Google Maps URL",
    "Source",
    "Scraped At",
    "PageSpeed Score",
    "Mobile Friendly",
    "HTTPS",
    "Load Time (ms)",
    "Gaps Analysis",
    "Est. Lost Revenue/Month",
    "Rank Score",
    "Rank Position",
    "Build Platform",
    "Build Prompt",
    "Outreach Channel",
    "Outreach Language",
    "Outreach Status",
    "Outreach Subject",
    "Outreach Body"
  ];

  const rows = leads.map((lead) => {
    const leadId = lead.id;
    const audit = audits?.[leadId] || {};
    const rank = rankings?.[leadId] || {};
    const build = builds?.[leadId] || {};
    const outr = outreach?.[leadId] || {};

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address}`)}`;

    const fields = [
      metadata?.sessionId || (lead as any).sessionId || "",
      metadata?.niche || "",
      metadata?.city || "",
      lead.name,
      lead.category,
      lead.address,
      lead.city,
      lead.phone || "",
      lead.whatsapp || "",
      lead.email || "",
      lead.website || "",
      lead.rating !== undefined ? lead.rating : "",
      lead.reviewsCount !== undefined ? lead.reviewsCount : "",
      lead.lat,
      lead.lng,
      mapsUrl,
      (lead as any).source || "seed",
      lead.createdAt || "",
      audit.pageSpeedScore !== undefined ? audit.pageSpeedScore : "",
      audit.mobileFriendly !== undefined ? (audit.mobileFriendly ? "Yes" : "No") : "",
      audit.https !== undefined ? (audit.https ? "Yes" : "No") : "",
      audit.loadTimeMs !== undefined ? audit.loadTimeMs : "",
      audit.gaps ? audit.gaps.join(" | ") : "",
      audit.estLostRevenuePerMonth !== undefined ? audit.estLostRevenuePerMonth : "",
      rank.score !== undefined ? rank.score : "",
      rank.rank !== undefined ? rank.rank : "",
      build.platform || "",
      build.prompt || "",
      outr.channel || "",
      outr.language || "",
      outr.status || "",
      outr.subject || "",
      outr.body || ""
    ];

    return fields.map((f) => escapeCsv(f)).join(",");
  });

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export async function uploadCsvExport(uid: string, csv: string) {
  try {
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
  } catch (error) {
    console.error("Storage upload failed (non-blocking):", error);
    return null;
  }
}

// === Session CRUD & Pipeline Functions ===

import type { ScrapeSession } from "@/lib/types";

function serializeSession(id: string, data: DocumentData): ScrapeSession {
  return {
    id,
    createdAt: timestampToIso(data.createdAt) ?? new Date().toISOString(),
    updatedAt: timestampToIso(data.updatedAt) ?? new Date().toISOString(),
    niche: String(data.niche ?? ""),
    city: String(data.city ?? ""),
    countRequested: Number(data.countRequested ?? 0),
    countReceived: Number(data.countReceived ?? 0),
    source: (data.source as any) ?? "seed",
    status: (data.status as any) ?? "completed",
    creditsUsed: Number(data.creditsUsed ?? 0),
    durationMs: Number(data.durationMs ?? 0),
    error: data.error,
    pipeline: {
      scrapeComplete: !!data.pipeline?.scrapeComplete,
      auditComplete: !!data.pipeline?.auditComplete,
      rankComplete: !!data.pipeline?.rankComplete,
      buildComplete: !!data.pipeline?.buildComplete,
      outreachComplete: !!data.pipeline?.outreachComplete,
    }
  };
}

export async function createSession(uid: string, session: {
  niche: string;
  city: string;
  countRequested: number;
  countReceived: number;
  source: string;
  status: string;
  creditsUsed: number;
  durationMs: number;
  error?: string;
  pipeline: {
    scrapeComplete: boolean;
    auditComplete: boolean;
    rankComplete: boolean;
    buildComplete: boolean;
    outreachComplete: boolean;
  };
}) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid).collection("sessions").doc();
  
  const data = {
    ...session,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  await ref.set(data);
  return {
    id: ref.id,
    ...session,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateSessionPipeline(uid: string, sessionId: string, stage: "scrapeComplete" | "auditComplete" | "rankComplete" | "buildComplete" | "outreachComplete", value = true) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId);
  await ref.update({
    [`pipeline.${stage}`]: value,
    updatedAt: FieldValue.serverTimestamp()
  });
}

export async function saveSessionLeads(uid: string, sessionId: string, leads: Lead[]) {
  if (leads.length === 0) return;
  const db = getAdminDb();
  const batch = db.batch();
  
  for (const lead of leads) {
    const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId).collection("leads").doc(lead.id);
    const data = cleanObject({
      ...lead,
      sessionId,
      createdAt: lead.createdAt ? Timestamp.fromDate(new Date(lead.createdAt)) : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    batch.set(ref, data);
  }
  
  await batch.commit();
}

export async function saveSessionAudits(uid: string, sessionId: string, audits: Record<string, any>) {
  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;
  
  for (const [leadId, audit] of Object.entries(audits)) {
    if (!audit) continue;
    const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId).collection("audits").doc(leadId);
    batch.set(ref, {
      ...audit,
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    });
    count++;
  }
  
  if (count > 0) {
    await batch.commit();
    await updateSessionPipeline(uid, sessionId, "auditComplete", true);
  }
}

export async function saveSessionRankings(uid: string, sessionId: string, rankings: Record<string, any>) {
  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;
  
  for (const [leadId, rank] of Object.entries(rankings)) {
    if (!rank) continue;
    const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId).collection("rankings").doc(leadId);
    batch.set(ref, {
      ...rank,
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    });
    count++;
  }
  
  if (count > 0) {
    await batch.commit();
    await updateSessionPipeline(uid, sessionId, "rankComplete", true);
  }
}

export async function saveSessionBuild(uid: string, sessionId: string, build: {
  leadId: string;
  leadName: string;
  platform: string;
  prompt: string;
  version: number;
}) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId).collection("builds").doc(`${build.leadId}-${build.platform}`);
  
  const data = {
    ...build,
    sessionId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await ref.set(data);
  await updateSessionPipeline(uid, sessionId, "buildComplete", true);
  return data;
}

export async function saveSessionOutreach(uid: string, sessionId: string, outreach: {
  leadId: string;
  leadName: string;
  channel: string;
  language: string;
  subject?: string;
  body: string;
  followUp?: string;
  status: string;
}) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid).collection("sessions").doc(sessionId).collection("outreach").doc(`${outreach.leadId}-${outreach.channel}`);
  
  const data = {
    ...outreach,
    sessionId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await ref.set(data);
  await updateSessionPipeline(uid, sessionId, "outreachComplete", true);
  return data;
}

export async function getUserSessions(uid: string, options: { limit?: number; cursor?: string; search?: string; sort?: string }) {
  const db = getAdminDb();
  const limit = options.limit || 20;
  
  let query = db.collection("users").doc(uid).collection("sessions") as FirebaseFirestore.Query;
  
  // Sort
  if (options.sort === "oldest") {
    query = query.orderBy("createdAt", "asc");
  } else {
    query = query.orderBy("createdAt", "desc");
  }
  
  if (options.cursor) {
    const cursorDoc = await db.collection("users").doc(uid).collection("sessions").doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }
  
  const snap = await query.get();
  let sessions = snap.docs.map((doc) => serializeSession(doc.id, doc.data()));
  
  // Filter by search string in memory since firestore prefix search is complex
  if (options.search) {
    const term = options.search.toLowerCase();
    sessions = sessions.filter(
      (s) => s.niche.toLowerCase().includes(term) || s.city.toLowerCase().includes(term)
    );
  }
  
  const paginated = sessions.slice(0, limit);
  const nextCursor = sessions.length > limit ? paginated[paginated.length - 1].id : null;
  
  return { sessions: paginated, nextCursor };
}

export async function getSessionDetail(uid: string, sessionId: string) {
  const db = getAdminDb();
  const sessionRef = db.collection("users").doc(uid).collection("sessions").doc(sessionId);
  const doc = await sessionRef.get();
  
  if (!doc.exists) return null;
  const session = serializeSession(doc.id, doc.data()!);
  
  // Fetch subcollections
  const [leadsSnap, auditsSnap, rankingsSnap, buildsSnap, outreachSnap] = await Promise.all([
    sessionRef.collection("leads").get(),
    sessionRef.collection("audits").get(),
    sessionRef.collection("rankings").get(),
    sessionRef.collection("builds").get(),
    sessionRef.collection("outreach").get()
  ]);
  
  const leads = leadsSnap.docs.map((d) => serializeLead(d.id, d.data()));
  
  const audits: Record<string, any> = {};
  auditsSnap.docs.forEach((d) => {
    audits[d.id] = d.data();
  });
  
  const rankings: Record<string, any> = {};
  rankingsSnap.docs.forEach((d) => {
    rankings[d.id] = d.data();
  });
  
  const builds: Record<string, any> = {};
  buildsSnap.docs.forEach((d) => {
    builds[d.id] = d.data();
  });
  
  const outreach: Record<string, any> = {};
  outreachSnap.docs.forEach((d) => {
    outreach[d.id] = d.data();
  });
  
  return {
    session,
    leads,
    audits,
    rankings,
    builds,
    outreach
  };
}

async function deleteCollectionDocs(ref: FirebaseFirestore.CollectionReference) {
  const snap = await ref.get();
  if (snap.empty) return;
  
  const chunks: FirebaseFirestore.DocumentReference[][] = [];
  let chunk: FirebaseFirestore.DocumentReference[] = [];
  
  snap.docs.forEach((doc) => {
    chunk.push(doc.ref);
    if (chunk.length >= 400) {
      chunks.push(chunk);
      chunk = [];
    }
  });
  if (chunk.length > 0) chunks.push(chunk);
  
  const db = getAdminDb();
  for (const group of chunks) {
    const batch = db.batch();
    group.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export async function deleteSession(uid: string, sessionId: string) {
  const db = getAdminDb();
  const sessionRef = db.collection("users").doc(uid).collection("sessions").doc(sessionId);
  
  // Delete all subcollections first
  await Promise.all([
    deleteCollectionDocs(sessionRef.collection("leads")),
    deleteCollectionDocs(sessionRef.collection("audits")),
    deleteCollectionDocs(sessionRef.collection("rankings")),
    deleteCollectionDocs(sessionRef.collection("builds")),
    deleteCollectionDocs(sessionRef.collection("outreach"))
  ]);
  
  await sessionRef.delete();
  return true;
}

export async function bulkDeleteSessions(uid: string, sessionIds: string[]) {
  for (const id of sessionIds) {
    await deleteSession(uid, id);
  }
  return true;
}

