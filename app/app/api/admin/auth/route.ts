import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminPassword, createAdminToken, verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.password || typeof body.password !== "string") {
       return NextResponse.json({ code: "BAD_INPUT", error: "Password is required." }, { status: 400 });
    }
    if (verifyAdminPassword(body.password)) {
      return NextResponse.json({ token: createAdminToken() });
    } else {
      return NextResponse.json({ code: "INVALID_PASSWORD", error: "Invalid admin password." }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ code: "ADMIN_ERROR", error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    return NextResponse.json({ valid: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ code: "ADMIN_ERROR", error: "Authentication failed." }, { status: 500 });
  }
}
