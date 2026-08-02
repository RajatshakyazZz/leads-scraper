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
    
    let totalUsers = 0;
    let totalLeads = 0;
    let todaySignups = 0;
    let freeUsers = 0;
    let proUsers = 0;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    usersSnap.forEach((doc) => {
      const data = doc.data();
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
