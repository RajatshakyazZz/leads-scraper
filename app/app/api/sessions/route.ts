import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getUserSessions } from "@/lib/user-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let decoded;
  try {
    decoded = await verifyRequestUser(req);
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "AUTH_ERROR", error: "Unable to verify login." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 20));
  const cursor = searchParams.get("cursor") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;

  try {
    const data = await getUserSessions(decoded.uid, { limit, cursor, search, sort });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error in GET /api/sessions:", e);
    return NextResponse.json({ code: "SERVER_ERROR", error: (e as Error).message }, { status: 500 });
  }
}
