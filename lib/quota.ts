import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { AccountProfile, AccountQuota } from "@/lib/types";

function readPositiveInteger(name: string, fallback: number, minimum: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : fallback;
}

const DEFAULT_LEAD_LIMIT = readPositiveInteger("FREE_LEAD_LIMIT", 15, 1);
const SCRAPE_RATE_LIMIT_REQUESTS = readPositiveInteger("SCRAPE_RATE_LIMIT_REQUESTS", 5, 1);
const SCRAPE_RATE_LIMIT_WINDOW_SECONDS = readPositiveInteger("SCRAPE_RATE_LIMIT_WINDOW_SECONDS", 60, 10);

function getProfile(decoded: DecodedIdToken): AccountProfile {
  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email : null,
    displayName: typeof decoded.name === "string" ? decoded.name : null,
    photoURL: typeof decoded.picture === "string" ? decoded.picture : null,
  };
}

function getPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function toQuota(leadLimit: number, leadsUsed: number): AccountQuota {
  const used = Math.max(0, Math.min(leadsUsed, leadLimit));
  return {
    leadLimit,
    leadsUsed: used,
    remaining: Math.max(0, leadLimit - used),
  };
}

export async function getOrCreateAccount(decoded: DecodedIdToken) {
  const db = getAdminDb();
  const profile = getProfile(decoded);
  const userRef = db.collection("users").doc(profile.uid);

  const quota = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(userRef);
    const data = snap.data() ?? {};
    const leadLimit = getPositiveNumber(data.leadLimit, DEFAULT_LEAD_LIMIT);
    const leadsUsed = getPositiveNumber(data.leadsUsed, 0);
    const nextQuota = toQuota(leadLimit, leadsUsed);

    transaction.set(
      userRef,
      {
        ...profile,
        leadLimit,
        leadsUsed: nextQuota.leadsUsed,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!snap.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    return nextQuota;
  });

  return { user: profile, quota };
}

export async function reserveLeadsForScrape(decoded: DecodedIdToken, requestedCount: number) {
  const db = getAdminDb();
  const profile = getProfile(decoded);
  const userRef = db.collection("users").doc(profile.uid);
  const rateRef = userRef.collection("rateLimits").doc("scrape");
  const now = Date.now();
  const windowMs = SCRAPE_RATE_LIMIT_WINDOW_SECONDS * 1000;

  return db.runTransaction(async (transaction) => {
    const [userSnap, rateSnap] = await Promise.all([transaction.get(userRef), transaction.get(rateRef)]);
    const userData = userSnap.data() ?? {};
    const rateData = rateSnap.data() ?? {};
    const leadLimit = getPositiveNumber(userData.leadLimit, DEFAULT_LEAD_LIMIT);
    const leadsUsed = getPositiveNumber(userData.leadsUsed, 0);
    const currentQuota = toQuota(leadLimit, leadsUsed);

    if (currentQuota.remaining <= 0) {
      throw new ScrapeAccessError("LEAD_LIMIT_REACHED", "Free leads khatam ho gaye. Contact to increase your limit.", 402, currentQuota);
    }

    const windowStart =
      rateData.windowStart instanceof Timestamp ? rateData.windowStart.toMillis() : getPositiveNumber(rateData.windowStart, now);
    const isSameWindow = now - windowStart < windowMs;
    const currentCount = isSameWindow ? getPositiveNumber(rateData.count, 0) : 0;

    if (currentCount >= SCRAPE_RATE_LIMIT_REQUESTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - windowStart)) / 1000));
      throw new ScrapeAccessError(
        "RATE_LIMITED",
        `Too many scrape requests. Try again in ${retryAfterSeconds}s.`,
        429,
        currentQuota,
        retryAfterSeconds,
      );
    }

    const reserved = Math.min(requestedCount, currentQuota.remaining);
    const nextQuota = toQuota(leadLimit, leadsUsed + reserved);

    transaction.set(
      userRef,
      {
        ...profile,
        leadLimit,
        leadsUsed: nextQuota.leadsUsed,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!userSnap.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    transaction.set(
      rateRef,
      {
        count: currentCount + 1,
        windowStart: Timestamp.fromMillis(isSameWindow ? windowStart : now),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { reserved, quota: nextQuota };
  });
}

export async function refundUnusedLeads(uid: string, unusedCount: number) {
  if (unusedCount <= 0) return null;

  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(userRef);
    const data = snap.data() ?? {};
    const leadLimit = getPositiveNumber(data.leadLimit, DEFAULT_LEAD_LIMIT);
    const leadsUsed = getPositiveNumber(data.leadsUsed, 0);
    const nextQuota = toQuota(leadLimit, Math.max(0, leadsUsed - unusedCount));

    transaction.set(
      userRef,
      {
        leadsUsed: nextQuota.leadsUsed,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return nextQuota;
  });
}

export class ScrapeAccessError extends Error {
  constructor(
    public code: "LEAD_LIMIT_REACHED" | "RATE_LIMITED",
    message: string,
    public status: number,
    public quota: AccountQuota,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ScrapeAccessError";
  }
}
