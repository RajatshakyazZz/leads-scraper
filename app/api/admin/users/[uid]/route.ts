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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    switch (action) {
      case "update_profile":
        if (value.status) {
          updates.status = value.status;
          updates.banned = value.status === "Blocked" || value.status === "Suspended";
        }
        if (value.adminNotes !== undefined) updates.adminNotes = String(value.adminNotes ?? "");
        if (value.leadLimit !== undefined) updates.leadLimit = Number(value.leadLimit);
        if (value.monthlyQuota !== undefined) updates.monthlyQuota = Number(value.monthlyQuota);
        if (value.dailyQuota !== undefined) updates.dailyQuota = Number(value.dailyQuota);
        if (value.customCredits !== undefined) updates.customCredits = Number(value.customCredits);
        break;
      case "set_plan":
        updates.plan = value;
        if (value === "pro") updates.leadLimit = 100;
        else if (value === "free") updates.leadLimit = 15;
        break;
      case "ban":
        updates.banned = true;
        updates.status = "Blocked";
        break;
      case "unban":
      case "restore":
        updates.banned = false;
        updates.status = "Active";
        break;
      case "set_status":
        updates.status = value;
        if (value === "Blocked" || value === "Suspended") {
          updates.banned = true;
        } else if (value === "Active") {
          updates.banned = false;
        }
        break;
      case "set_notes":
        updates.adminNotes = String(value ?? "");
        break;
      case "set_lead_limit":
      case "set_lifetime_quota":
        updates.leadLimit = Number(value);
        break;
      case "set_monthly_quota":
        updates.monthlyQuota = Number(value);
        break;
      case "set_daily_quota":
        updates.dailyQuota = Number(value);
        break;
      case "set_custom_credits":
        updates.customCredits = Number(value);
        break;
      case "reset_usage":
        updates.leadsUsed = 0;
        break;
      case "reset_quota":
        updates.leadsUsed = 0;
        updates.monthlyLeadsUsed = 0;
        updates.dailyLeadsUsed = 0;
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
    
    // Clear dynamic session data and all their subcollections first
    const sessionsSnap = await userRef.collection("sessions").get();
    for (const sessionDoc of sessionsSnap.docs) {
      const subSubs = ["leads", "audits", "rankings", "builds", "outreach"];
      for (const subSub of subSubs) {
        const subSubSnap = await sessionDoc.ref.collection(subSub).get();
        const batch = db.batch();
        subSubSnap.docs.forEach(doc => batch.delete(doc.ref));
        if (subSubSnap.size > 0) {
          await batch.commit();
        }
      }
      await sessionDoc.ref.delete();
    }
    
    // Clear root subcollections
    const subcollections = ["leads", "prompts", "rateLimits", "sessions"];
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
