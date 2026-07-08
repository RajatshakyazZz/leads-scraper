import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    const db = getAdminDb();
    
    const usersSnap = await db.collection("users").get();
    
    let topUsersArray: { uid: string, email: string, leadsUsed: number }[] = [];
    
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.leadsUsed > 0) {
        topUsersArray.push({
          uid: doc.id,
          email: data.email || "Unknown",
          leadsUsed: data.leadsUsed
        });
      }
    });
    
    topUsersArray.sort((a, b) => b.leadsUsed - a.leadsUsed);
    const topUsers = topUsersArray.slice(0, 10);
    
    const leadsSnap = await db.collectionGroup("leads").orderBy("createdAt", "desc").limit(1000).get();
    
    const nicheCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    let scrapesToday = 0;
    let scrapesThisMonth = 0;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    leadsSnap.forEach((doc) => {
      const data = doc.data();
      
      const niche = data.scrapeNiche || data.category || "Unknown";
      nicheCounts[niche] = (nicheCounts[niche] || 0) + 1;
      
      const city = data.scrapeCity || data.city || "Unknown";
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
