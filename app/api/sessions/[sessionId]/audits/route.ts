import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { saveSessionAudits } from "@/lib/user-data";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  let decoded;
  try {
    decoded = await verifyRequestUser(req);
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "AUTH_ERROR", error: "Unable to verify login." }, { status: 401 });
  }

  const { sessionId } = await params;
  
  try {
    const { audits } = await req.json();
    if (!audits) {
      return NextResponse.json({ code: "BAD_INPUT", error: "Audits payload is required." }, { status: 400 });
    }
    
    await saveSessionAudits(decoded.uid, sessionId, audits);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in POST /api/sessions/[sessionId]/audits:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
