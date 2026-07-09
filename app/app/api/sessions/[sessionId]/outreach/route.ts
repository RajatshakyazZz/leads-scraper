import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { saveSessionOutreach } from "@/lib/user-data";

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
    const outreach = await req.json();
    if (!outreach || !outreach.leadId || !outreach.channel || !outreach.body) {
      return NextResponse.json({ code: "BAD_INPUT", error: "Invalid outreach payload." }, { status: 400 });
    }
    
    const saved = await saveSessionOutreach(decoded.uid, sessionId, {
      leadId: outreach.leadId,
      leadName: outreach.leadName || "Unknown",
      channel: outreach.channel,
      language: outreach.language || "english",
      subject: outreach.subject,
      body: outreach.body,
      followUp: outreach.followUp,
      status: outreach.status || "draft"
    });
    
    return NextResponse.json({ success: true, outreach: saved });
  } catch (e) {
    console.error("Error in POST /api/sessions/[sessionId]/outreach:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
