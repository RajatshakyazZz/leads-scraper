import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { saveSessionBuild } from "@/lib/user-data";

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
    const build = await req.json();
    if (!build || !build.leadId || !build.platform || !build.prompt) {
      return NextResponse.json({ code: "BAD_INPUT", error: "Invalid build payload." }, { status: 400 });
    }
    
    const saved = await saveSessionBuild(decoded.uid, sessionId, {
      leadId: build.leadId,
      leadName: build.leadName || "Unknown",
      platform: build.platform,
      prompt: build.prompt,
      version: build.version || 1
    });
    
    return NextResponse.json({ success: true, build: saved });
  } catch (e) {
    console.error("Error in POST /api/sessions/[sessionId]/builds:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
