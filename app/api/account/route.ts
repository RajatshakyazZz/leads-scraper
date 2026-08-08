import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser, getServiceAccountDiagnostics, getAdminDb } from "@/lib/firebase-admin";
import { getOrCreateAccount } from "@/lib/quota";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const account = await getOrCreateAccount(decoded);
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const userData = userDoc.data() || {};

    // Get aggregated stats
    const sessionsSnap = await db.collection("users").doc(decoded.uid).collection("sessions").get();
    const leadsSnap = await db.collection("users").doc(decoded.uid).collection("leads").get();

    return NextResponse.json({
      ...account,
      profile: {
        uid: decoded.uid,
        email: decoded.email || userData.email || null,
        displayName: userData.displayName || decoded.name || "ClientForge Agency",
        agencyName: userData.agencyName || "Growth Forge Studio",
        professionalRole: userData.professionalRole || "Freelance Web Specialist & Outreach Strategist",
        phone: userData.phone || "+91 98765 43210",
        whatsapp: userData.whatsapp || "+91 98765 43210",
        portfolioUrl: userData.portfolioUrl || "https://clientforge.app",
        calComLink: userData.calComLink || "https://cal.com/agency/30min",
        pitchSignature: userData.pitchSignature || "Best regards,\nRajat Shakya | ClientForge Lead Team",
        photoURL: userData.photoURL || decoded.picture || "/icon.png",
      },
      stats: {
        totalSessions: sessionsSnap.size,
        totalLeads: leadsSnap.size,
        leadsUsed: account.quota?.leadsUsed ?? 0,
        leadLimit: account.quota?.leadLimit ?? 15,
      }
    });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    console.error("Error in /api/account:", e);
    const diag = getServiceAccountDiagnostics();
    return NextResponse.json({ code: "ACCOUNT_ERROR", error: `Unable to load account profile: ${(e as Error).message}. Diagnostics: ${JSON.stringify(diag)}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const body = await req.json();
    const db = getAdminDb();

    const allowedFields = [
      "displayName",
      "agencyName",
      "professionalRole",
      "phone",
      "whatsapp",
      "portfolioUrl",
      "calComLink",
      "pitchSignature",
      "photoURL"
    ];

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = String(body[key]).trim();
      }
    }

    await db.collection("users").doc(decoded.uid).set(updateData, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    return NextResponse.json({ code: "UPDATE_ERROR", error: `Unable to update profile: ${(e as Error).message}` }, { status: 500 });
  }
}
