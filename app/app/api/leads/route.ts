import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getSavedLeads } from "@/lib/user-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const leads = await getSavedLeads(decoded.uid);
    return NextResponse.json({ leads });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    console.error("Error in /api/leads:", e);
    return NextResponse.json({ code: "LEADS_ERROR", error: `Unable to load saved leads: ${(e as Error).message}` }, { status: 500 });
  }
}
