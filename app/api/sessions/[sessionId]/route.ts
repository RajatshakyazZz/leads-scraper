import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getSessionDetail, deleteSession } from "@/lib/user-data";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
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
    const detail = await getSessionDetail(decoded.uid, sessionId);
    if (!detail) {
      return NextResponse.json({ code: "NOT_FOUND", error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (e) {
    console.error("Error in GET /api/sessions/[sessionId]:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
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
    await deleteSession(decoded.uid, sessionId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in DELETE /api/sessions/[sessionId]:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
