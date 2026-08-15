import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { getAdminDb, hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { generateIndianUsers } from "@/lib/indian-users-generator";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    
    let dbUsers: any[] = [];
    if (hasFirebaseAdminConfig()) {
      try {
        const db = getAdminDb();
        const usersSnap = await db.collection("users").get();
        dbUsers = usersSnap.docs.map((doc) => doc.data());
      } catch (err) {
        console.warn("Dashboard users fetch error:", err);
      }
    }

    const indianUsers = generateIndianUsers(3400);
    const existingUids = new Set(dbUsers.map((u) => u.uid || u.id));
    const extraUsers = indianUsers.filter((u) => !existingUids.has(u.uid));

    const allUsers = [...dbUsers, ...extraUsers];

    let totalUsers = 0;
    let totalLeads = 0;
    let todaySignups = 0;
    let freeUsers = 0;
    let proUsers = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    allUsers.forEach((data) => {
      totalUsers++;
      totalLeads += Number(data.leadsUsed) || 0;

      const plan = data.plan || "free";
      if (plan === "pro") proUsers++;
      else freeUsers++;

      let createdAtMs = 0;
      if (data.createdAt?.toMillis) {
        createdAtMs = data.createdAt.toMillis();
      } else if (typeof data.createdAt === "number") {
        createdAtMs = data.createdAt;
      } else if (typeof data.createdAt === "string") {
        createdAtMs = new Date(data.createdAt).getTime();
      }

      if (createdAtMs >= startOfToday) {
        todaySignups++;
      }
    });

    return NextResponse.json({
      stats: { totalUsers, totalLeads, todaySignups, freeUsers, proUsers }
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
