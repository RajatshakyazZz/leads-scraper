import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError, writeAdminLog } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    verifyAdminRequest(req);
    const { uid } = await params;
    const body = await req.json();
    const { action, value } = body;
    
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    switch (action) {
      case "set_plan":
        updates.plan = value;
        if (value === "pro") updates.leadLimit = 100;
        else if (value === "free") updates.leadLimit = 15;
        break;
      case "ban":
        updates.banned = true;
        break;
      case "unban":
        updates.banned = false;
        break;
      case "reset_usage":
        updates.leadsUsed = 0;
        break;
      case "set_lead_limit":
        updates.leadLimit = Number(value);
        break;
      default:
        return NextResponse.json({ code: "BAD_ACTION", error: "Invalid action." }, { status: 400 });
    }

    await userRef.set(updates, { merge: true });
    await writeAdminLog(db, action, `users/${uid}`, JSON.stringify(value ?? null));
    
    const updatedSnap = await userRef.get();
    return NextResponse.json(updatedSnap.data());
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    verifyAdminRequest(req);
    const { uid } = await params;
    
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    
    const subcollections = ["leads", "prompts", "rateLimits"];
    for (const sub of subcollections) {
      const subRef = userRef.collection(sub);
      const snap = await subRef.get();
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      if (snap.size > 0) {
        await batch.commit();
      }
    }
    
    await userRef.delete();
    await writeAdminLog(db, "delete_user", `users/${uid}`);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
