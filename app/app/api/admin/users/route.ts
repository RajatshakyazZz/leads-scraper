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
    const search = searchParams.get("search")?.toLowerCase() || "";
    const limitParam = Number(searchParams.get("limit")) || 20;
    
    const db = getAdminDb();
    const usersSnap = await db.collection("users").orderBy("createdAt", "desc").get();
    
    let users = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || null,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        plan: data.plan || "free",
        banned: !!data.banned,
        leadLimit: data.leadLimit || 15,
        leadsUsed: data.leadsUsed || 0,
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
        lastLoginAt: timestampToIso(data.lastLoginAt)
      };
    });

    if (search) {
      users = users.filter(u => 
        (u.email && u.email.toLowerCase().includes(search)) || 
        (u.displayName && u.displayName.toLowerCase().includes(search))
      );
    }
    
    const paginatedUsers = users.slice(0, limitParam);

    return NextResponse.json({ users: paginatedUsers, nextCursor: null });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
