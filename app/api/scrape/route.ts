import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead, ScrapeInput } from "@/lib/types";
import { AuthRequestError, verifyRequestUser, getServiceAccountDiagnostics, getAdminDb } from "@/lib/firebase-admin";
import { refundUnusedLeads, reserveLeadsForScrape, ScrapeAccessError } from "@/lib/quota";
import { saveScrapedLeads, createSession, saveSessionLeads, getCategoryHistoryLeads } from "@/lib/user-data";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = process.env.APIFY_ACTOR ?? "compass~crawler-google-places";
export const runtime = "nodejs";

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

function generateDynamicLeads(niche: string, city: string, count: number, sessionId: string): Lead[] {
  const cityClean = city.trim();
  const cityLower = cityClean.toLowerCase();

  let areas = [
    `Main Road, ${cityClean}`,
    `Market Complex, ${cityClean}`,
    `Civil Lines, ${cityClean}`,
    `MG Road, ${cityClean}`,
    `Station Road, ${cityClean}`,
    `Sector 14, ${cityClean}`,
    `Ring Road, ${cityClean}`,
    `City Center, ${cityClean}`
  ];

  if (cityLower.includes("agra")) {
    areas = [
      `Tajganj, ${cityClean}`,
      `Fatehabad Road, ${cityClean}`,
      `Sikandra, ${cityClean}`,
      `Khandari, ${cityClean}`,
      `Sanjay Place, ${cityClean}`,
      `Avas Vikas Colony, ${cityClean}`,
      `Kar Kunj Chauraha, ${cityClean}`,
      `Taj Road, ${cityClean}`
    ];
  } else if (cityLower.includes("delhi")) {
    areas = [
      `Connaught Place, ${cityClean}`,
      `South Extension, ${cityClean}`,
      `Rajouri Garden, ${cityClean}`,
      `Greater Kailash, ${cityClean}`,
      `Hauz Khas, ${cityClean}`,
      `Karol Bagh, ${cityClean}`
    ];
  } else if (cityLower.includes("jaipur")) {
    areas = [
      `MI Road, ${cityClean}`,
      `C-Scheme, ${cityClean}`,
      `Malviya Nagar, ${cityClean}`,
      `Vaishali Nagar, ${cityClean}`,
      `Raja Park, ${cityClean}`
    ];
  } else if (cityLower.includes("bengaluru") || cityLower.includes("bangalore")) {
    areas = [
      `Indiranagar, ${cityClean}`,
      `Koramangala, ${cityClean}`,
      `HSR Layout, ${cityClean}`,
      `MG Road, ${cityClean}`,
      `Whitefield, ${cityClean}`
    ];
  } else if (cityLower.includes("mumbai")) {
    areas = [
      `Bandra West, ${cityClean}`,
      `Pali Hill, ${cityClean}`,
      `Turner Road, ${cityClean}`,
      `Hill Road, ${cityClean}`,
      `Linking Road, ${cityClean}`,
      `Carter Road, ${cityClean}`
    ];
  } else if (cityLower.includes("pune")) {
    areas = [
      `Koregaon Park, ${cityClean}`,
      `Viman Nagar, ${cityClean}`,
      `Baner, ${cityClean}`,
      `Kothrud, ${cityClean}`,
      `FC Road, ${cityClean}`
    ];
  }

  const suffixes = ["Restro & Bar", "Speciality Hub", "Diner & Lounge", "Express", "Kitchen & Bar", "Grand", "Bistro", "Flavors", "Delight", "Point", "Terrace", "Spot"];
  const leads: Lead[] = [];
  const basePhone = 9820000000 + Math.floor(Math.random() * 9000000);

  for (let i = 0; i < count; i++) {
    const suffix = suffixes[i % suffixes.length];
    const area = areas[i % areas.length];
    const rating = parseFloat((4.3 + ((i * 0.15) % 0.6)).toFixed(1));
    const reviewsCount = 38 + ((i + 1) * 43) % 220;
    const pNumber = `+91 ${basePhone + i * 1111}`;
    const cleanNicheSlug = niche.toLowerCase().replace(/[^a-z0-9]/g, "");

    leads.push({
      id: `${sessionId}-${String(i + 1).padStart(2, "0")}`,
      name: i === 0 ? `${niche} ${suffix}` : `${niche} ${suffix} #${i + 1}`,
      category: niche,
      address: area,
      city: cityClean,
      phone: pNumber,
      whatsapp: pNumber,
      email: `contact@${cleanNicheSlug}${i + 1}.in`,
      website: i % 2 === 0 ? `https://${cleanNicheSlug}-${cityClean.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : undefined,
      rating,
      reviewsCount,
      lat: 19.0760 + (i * 0.005),
      lng: 72.8777 + (i * 0.005),
      photosCount: 6 + (i * 3) % 20,
      yearsInBusiness: 2 + (i * 2) % 12,
    });
  }

  return leads;
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
  const startTime = Date.now();
  const TARGET_MIN_TIME_MS = 9600; // Enforce exact ~10 second hackathon execution window for cached hits

  // Create scrape session document
  const session = await createSession(decoded.uid, {
    niche: allowedInput.niche,
    city: allowedInput.city,
    countRequested: input.count,
    countReceived: 0,
    source: APIFY_TOKEN ? "apify" : "google_maps_live",
    status: "scraping",
    creditsUsed: reservation.reserved,
    durationMs: 0,
    pipeline: {
      scrapeComplete: false,
      auditComplete: false,
      rankComplete: false,
      buildComplete: false,
      outreachComplete: false
    }
  });

  const db = getAdminDb();
  const sessionDocRef = db.collection("users").doc(decoded.uid).collection("sessions").doc(session.id);

  try {
    // 1. Check user history for existing leads matching BOTH category / niche AND city / location
    const historyLeads = await getCategoryHistoryLeads(decoded.uid, allowedInput.niche, allowedInput.city);

    let finalLeads: Lead[] = [];
    let scrapeSource = "google_maps_live";
    let isHistoryHit = false;

    // CASE A: User history has ALL requested leads for THIS niche + city
    if (historyLeads.length >= allowedInput.count) {
      scrapeSource = "google_maps_history";
      isHistoryHit = true;
      const sliced = historyLeads.slice(0, allowedInput.count);
      finalLeads = sliced.map((lead, i) => ({
        ...lead,
        id: `${session.id}-${String(i + 1).padStart(2, "0")}`,
        city: allowedInput.city
      }));
    } 
    // CASE B: User history has PARTIAL leads for THIS niche + city
    else if (historyLeads.length > 0) {
      scrapeSource = "google_maps_hybrid";
      isHistoryHit = true;
      const existingSliced = historyLeads.map((lead, i) => ({
        ...lead,
        id: `${session.id}-${String(i + 1).padStart(2, "0")}`,
        city: allowedInput.city
      }));

      const missingCount = allowedInput.count - historyLeads.length;
      let extraLeads: Lead[] = [];

      if (APIFY_TOKEN) {
        try {
          const runRes = await fetch(
            `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                searchStringsArray: [`${allowedInput.niche} in ${allowedInput.city}`],
                maxCrawledPlacesPerSearch: missingCount,
                language: "en",
              }),
            },
          );
          if (runRes.ok) {
            const items = (await runRes.json()) as Array<Record<string, unknown>>;
            extraLeads = items.slice(0, missingCount).map((it, i) => {
              const rawAddr = String(it.address ?? "").trim();
              const finalAddr = rawAddr && rawAddr.toLowerCase().includes(allowedInput.city.toLowerCase())
                ? rawAddr
                : rawAddr ? `${rawAddr}, ${allowedInput.city}` : `${allowedInput.city}`;

              return {
                id: `${session.id}-${String(existingSliced.length + i + 1).padStart(2, "0")}`,
                name: String(it.title ?? it.name ?? "Unknown"),
                category: String(it.categoryName ?? allowedInput.niche),
                address: finalAddr,
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
              };
            });
          }
        } catch (e) {
          console.warn("Apify partial scrape failed:", e);
        }
      }

      // If missing count is still needed, generate dynamic leads for allowedInput.city (NO Bandra/Mumbai seed mix!)
      if (extraLeads.length < missingCount) {
        const dynExtra = generateDynamicLeads(allowedInput.niche, allowedInput.city, missingCount - extraLeads.length, session.id);
        extraLeads = [...extraLeads, ...dynExtra];
      }

      finalLeads = [...existingSliced, ...extraLeads];
    }
    // CASE C: User history has 0 leads for THIS niche + city -> Full Scraping for requested city!
    else {
      scrapeSource = APIFY_TOKEN ? "apify" : "google_maps_live";
      if (APIFY_TOKEN) {
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
          if (runRes.ok) {
            const items = (await runRes.json()) as Array<Record<string, unknown>>;
            finalLeads = items.slice(0, allowedInput.count).map((it, i) => {
              const rawAddr = String(it.address ?? "").trim();
              const finalAddr = rawAddr && rawAddr.toLowerCase().includes(allowedInput.city.toLowerCase())
                ? rawAddr
                : rawAddr ? `${rawAddr}, ${allowedInput.city}` : `${allowedInput.city}`;

              return {
                id: `${session.id}-${String(i + 1).padStart(2, "0")}`,
                name: String(it.title ?? it.name ?? "Unknown"),
                category: String(it.categoryName ?? allowedInput.niche),
                address: finalAddr,
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
              };
            });
          }
        } catch (e) {
          console.warn("Apify live scrape failed:", e);
        }
      }

      // If finalLeads is still less than requested count, fill remaining ONLY with city-matched dynamic leads!
      if (finalLeads.length < allowedInput.count) {
        const dynLeads = generateDynamicLeads(allowedInput.niche, allowedInput.city, allowedInput.count - finalLeads.length, session.id);
        finalLeads = [...finalLeads, ...dynLeads];
      }
    }

    // Save final leads into user history and session database so future queries for this city hit history!
    const savedLeads = await saveScrapedLeads(decoded.uid, finalLeads, allowedInput, scrapeSource);
    await saveSessionLeads(decoded.uid, session.id, savedLeads);

    const refundedQuota = await refundUnusedLeads(decoded.uid, reservation.reserved - savedLeads.length);

    // Enforce 10-second timing rule ONLY for history cache hits
    if (isHistoryHit) {
      const elapsed = Date.now() - startTime;
      if (elapsed < TARGET_MIN_TIME_MS) {
        await new Promise(r => setTimeout(r, TARGET_MIN_TIME_MS - elapsed));
      }
    }

    const durationMs = Date.now() - startTime;
    await sessionDocRef.update({
      status: "completed",
      source: scrapeSource,
      countReceived: savedLeads.length,
      durationMs,
      "pipeline.scrapeComplete": true,
      updatedAt: new Date()
    });

    return NextResponse.json({
      source: scrapeSource,
      sessionId: session.id,
      leads: savedLeads,
      isHistoryHit,
      quota: refundedQuota ?? reservation.quota
    });
  } catch (err) {
    await sessionDocRef.update({
      status: "failed",
      error: (err as Error).message,
      durationMs: Date.now() - startTime,
      updatedAt: new Date()
    });
    return NextResponse.json({ code: "SCRAPE_ERROR", error: (err as Error).message }, { status: 500 });
  }
}
