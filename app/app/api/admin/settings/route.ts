import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError, writeAdminLog } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const defaultSettings = {
  freeLeadLimit: 15,
  proLeadLimit: 100,
  dailyScrapeLimit: 50,
  monthlyExportLimit: 100,
  pageSpeedDailyLimit: 50,
  apifyDailyLimit: 50,
  allowRegistration: true,
  maintenanceMode: false,
  enableScraping: true,
  enableExport: true,
  enableOutreach: true,
  enableAiBuild: true,
  enableRanking: true,
};

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    const db = getAdminDb();
    
    const settingsSnap = await db.collection("settings").doc("app").get();
    const currentSettings = settingsSnap.exists ? settingsSnap.data() : {};
    
    return NextResponse.json({ ...defaultSettings, ...currentSettings });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    verifyAdminRequest(req);
    const body = await req.json();
    const db = getAdminDb();
    
    const settingsRef = db.collection("settings").doc("app");
    const updates = { ...body, updatedAt: FieldValue.serverTimestamp() };
    
    await settingsRef.set(updates, { merge: true });
    await writeAdminLog(db, "update_settings", "settings/app", JSON.stringify(body));
    
    const updatedSnap = await settingsRef.get();
    return NextResponse.json({ ...defaultSettings, ...updatedSnap.data() });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
