import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function timestampToIso(value: any) {
  if (!value) return undefined;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return typeof value === "string" ? value : undefined;
}

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit")) || 30;
    
    const db = getAdminDb();
    const logsSnap = await db.collection("logs").orderBy("createdAt", "desc").limit(limitParam).get();
    
    const logs = logsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        action: data.action,
        target: data.target,
        details: data.details,
        source: data.source,
        createdAt: timestampToIso(data.createdAt)
      };
    });

    return NextResponse.json({ logs, nextCursor: null });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
