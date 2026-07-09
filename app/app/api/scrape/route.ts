import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, ScrapeInput } from "@/lib/types";
import { AuthRequestError, verifyRequestUser, getServiceAccountDiagnostics } from "@/lib/firebase-admin";
import { refundUnusedLeads, reserveLeadsForScrape, ScrapeAccessError } from "@/lib/quota";
import { saveScrapedLeads } from "@/lib/user-data";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = process.env.APIFY_ACTOR ?? "compass~crawler-google-places";
export const runtime = "nodejs";

async function loadSeed(): Promise<{ leads: Lead[] }> {
  const p = path.join(process.cwd(), "data", "leads-seed.json");
  const raw = await fs.readFile(p, "utf-8");
  const json = JSON.parse(raw);
  return { leads: json.leads as Lead[] };
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function parseScrapeInput(value: unknown): ScrapeInput {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const niche = cleanText(raw.niche, 80);
  const city = cleanText(raw.city, 120);
  const count = Math.max(1, Math.min(25, Math.floor(Number(raw.count) || 1)));

  if (!niche || !city) {
    throw new Error("Niche and location are required.");
  }

  return { niche, city, count };
}

function accessErrorResponse(e: ScrapeAccessError) {
  const headers = e.retryAfterSeconds ? { "Retry-After": String(e.retryAfterSeconds) } : undefined;
  return NextResponse.json(
    { code: e.code, error: e.message, quota: e.quota, retryAfterSeconds: e.retryAfterSeconds },
    { status: e.status, headers },
  );
}

export async function POST(req: Request) {
  let input: ScrapeInput;
  try {
    input = parseScrapeInput(await req.json());
  } catch (e) {
    return NextResponse.json({ code: "BAD_INPUT", error: (e as Error).message }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await verifyRequestUser(req);
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "AUTH_ERROR", error: "Unable to verify login." }, { status: 401 });
  }

  let reservation;
  try {
    reservation = await reserveLeadsForScrape(decoded, input.count);
  } catch (e) {
    if (e instanceof ScrapeAccessError) return accessErrorResponse(e);
    console.error("Error in /api/scrape:", e);
    const diag = getServiceAccountDiagnostics();
    return NextResponse.json({ code: "QUOTA_ERROR", error: `Unable to reserve lead quota: ${(e as Error).message}. Diagnostics: ${JSON.stringify(diag)}` }, { status: 500 });
  }

  const allowedInput = { ...input, count: reservation.reserved };

  // No Apify token = serve cached seed data after quota has been reserved.
  if (!APIFY_TOKEN) {
    const { leads } = await loadSeed();
    const sliced = leads.slice(0, Math.max(1, Math.min(allowedInput.count, leads.length)));
    const savedLeads = await saveScrapedLeads(decoded.uid, sliced, allowedInput, "seed");
    const refundedQuota = await refundUnusedLeads(decoded.uid, reservation.reserved - sliced.length);
    return NextResponse.json({ source: "seed", leads: savedLeads, quota: refundedQuota ?? reservation.quota });
  }

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [`${allowedInput.niche} in ${allowedInput.city}`],
          maxCrawledPlacesPerSearch: allowedInput.count,
          language: "en",
        }),
      },
    );
    if (!runRes.ok) throw new Error(`Apify ${runRes.status}`);
    const items = (await runRes.json()) as Array<Record<string, unknown>>;

    const leads: Lead[] = items.slice(0, allowedInput.count).map((it, i) => ({
      id: `live-${String(i + 1).padStart(2, "0")}`,
      name: String(it.title ?? it.name ?? "Unknown"),
      category: String(it.categoryName ?? allowedInput.niche),
      address: String(it.address ?? ""),
      city: allowedInput.city,
      phone: it.phone ? String(it.phone) : undefined,
      whatsapp: it.phone ? String(it.phone) : undefined,
      email: undefined,
      website: it.website ? String(it.website) : undefined,
      rating: typeof it.totalScore === "number" ? (it.totalScore as number) : undefined,
      reviewsCount: typeof it.reviewsCount === "number" ? (it.reviewsCount as number) : undefined,
      lat: typeof (it.location as { lat?: number })?.lat === "number" ? (it.location as { lat: number }).lat : 19.06,
      lng: typeof (it.location as { lng?: number })?.lng === "number" ? (it.location as { lng: number }).lng : 72.83,
      photosCount: typeof it.imagesCount === "number" ? (it.imagesCount as number) : undefined,
    }));

    const savedLeads = await saveScrapedLeads(decoded.uid, leads, allowedInput, "apify");
    const refundedQuota = await refundUnusedLeads(decoded.uid, reservation.reserved - leads.length);
    return NextResponse.json({ source: "apify", leads: savedLeads, quota: refundedQuota ?? reservation.quota });
  } catch (e) {
    const { leads } = await loadSeed();
    const sliced = leads.slice(0, allowedInput.count);
    const savedLeads = await saveScrapedLeads(decoded.uid, sliced, allowedInput, "seed-fallback");
    const refundedQuota = await refundUnusedLeads(decoded.uid, reservation.reserved - sliced.length);
    return NextResponse.json({ source: "seed-fallback", error: (e as Error).message, leads: savedLeads, quota: refundedQuota ?? reservation.quota });
  }
}
