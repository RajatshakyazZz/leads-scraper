import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    const db = getAdminDb();
    
    // Fetch users for top users ranking
    const usersSnap = await db.collection("users").get();
    
    const topUsersArray: { uid: string; email: string; leadsUsed: number }[] = [];
    
    usersSnap.forEach((doc) => {
      const data = doc.data();
      const leadsUsed = Number(data.leadsUsed) || 0;
      topUsersArray.push({
        uid: doc.id,
        email: data.email || `User (${doc.id.slice(0, 6)})`,
        leadsUsed
      });
    });
    
    topUsersArray.sort((a, b) => b.leadsUsed - a.leadsUsed);
    const topUsers = topUsersArray.slice(0, 10);

    // Aggregate analytics safely
    const nicheCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    let scrapesToday = 0;
    let scrapesThisMonth = 0;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 1. Try querying collectionGroup("leads") safely
    try {
      // Avoid orderBy to prevent missing composite index errors
      const leadsSnap = await db.collectionGroup("leads").limit(1000).get();
      leadsSnap.forEach((doc) => {
        const data = doc.data();
        const niche = data.category || data.scrapeNiche || "General";
        nicheCounts[niche] = (nicheCounts[niche] || 0) + 1;

        const city = data.city || data.scrapeCity || "Unknown";
        cityCounts[city] = (cityCounts[city] || 0) + 1;

        let createdAtMs = 0;
        if (data.createdAt?.toMillis) {
          createdAtMs = data.createdAt.toMillis();
        } else if (typeof data.createdAt === "number") {
          createdAtMs = data.createdAt;
        } else if (typeof data.createdAt === "string") {
          createdAtMs = new Date(data.createdAt).getTime();
        }

        if (createdAtMs >= startOfToday) scrapesToday++;
        if (createdAtMs >= startOfMonth) scrapesThisMonth++;
      });
    } catch (err) {
      console.warn("Analytics collectionGroup(leads) query fallback:", err);
    }

    // 2. Try querying collectionGroup("sessions") safely for niche/city data if empty
    if (Object.keys(nicheCounts).length === 0) {
      try {
        const sessionsSnap = await db.collectionGroup("sessions").limit(500).get();
        sessionsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.niche) nicheCounts[data.niche] = (nicheCounts[data.niche] || 0) + (data.leadsCount || 1);
          if (data.city) cityCounts[data.city] = (cityCounts[data.city] || 0) + (data.leadsCount || 1);

          let createdAtMs = 0;
          if (data.createdAt?.toMillis) {
            createdAtMs = data.createdAt.toMillis();
          } else if (typeof data.createdAt === "number") {
            createdAtMs = data.createdAt;
          } else if (typeof data.createdAt === "string") {
            createdAtMs = new Date(data.createdAt).getTime();
          }

          if (createdAtMs >= startOfToday) scrapesToday += (data.leadsCount || 1);
          if (createdAtMs >= startOfMonth) scrapesThisMonth += (data.leadsCount || 1);
        });
      } catch (err) {
        console.warn("Analytics collectionGroup(sessions) query fallback:", err);
      }
    }

    // Convert count maps to sorted arrays
    const topNiches = Object.entries(nicheCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      topNiches,
      topCities,
      topUsers,
      scrapesToday,
      scrapesThisMonth
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
