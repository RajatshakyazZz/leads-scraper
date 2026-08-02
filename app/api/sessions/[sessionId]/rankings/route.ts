import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { saveSessionRankings } from "@/lib/user-data";

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
    const { rankings } = await req.json();
    if (!rankings) {
      return NextResponse.json({ code: "BAD_INPUT", error: "Rankings payload is required." }, { status: 400 });
    }
    
    await saveSessionRankings(decoded.uid, sessionId, rankings);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in POST /api/sessions/[sessionId]/rankings:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
