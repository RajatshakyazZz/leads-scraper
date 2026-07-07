import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getOrCreateAccount } from "@/lib/quota";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const account = await getOrCreateAccount(decoded);
    return NextResponse.json(account);
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    return NextResponse.json({ code: "ACCOUNT_ERROR", error: "Unable to load account quota." }, { status: 500 });
  }
}
