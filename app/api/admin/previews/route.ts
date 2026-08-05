import "server-only";
import { NextResponse } from "next/server";
import { verifyAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    verifyAdminRequest(req);
    const db = getAdminDb();
    
    const snap = await db.collection("published_previews").orderBy("createdAt", "desc").get();
    
    const previews: any[] = [];
    snap.forEach((doc) => {
      previews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({ success: true, previews });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message || "Failed to fetch published previews" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    verifyAdminRequest(req);
    const { searchParams } = new URL(req.url);
    let previewId = searchParams.get("id");

    if (!previewId) {
      const body = await req.json().catch(() => ({}));
      previewId = body.id || body.previewId;
    }

    if (!previewId) {
      return NextResponse.json({ error: "Missing preview ID" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("published_previews").doc(previewId).delete();

    return NextResponse.json({ success: true, message: `Preview ${previewId} deleted successfully.` });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message || "Failed to delete preview" }, { status: 500 });
  }
}
