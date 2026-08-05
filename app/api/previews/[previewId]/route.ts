import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { previewId } = await params;
    if (!previewId) {
      return NextResponse.json({ error: "Missing preview ID" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("published_previews").doc(previewId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Preview link not found or expired." }, { status: 404 });
    }

    // Increment views count asynchronously
    docRef.update({
      viewsCount: FieldValue.increment(1),
      lastViewedAt: new Date().toISOString(),
    }).catch((err) => console.error("Failed to increment viewsCount:", err));

    const data = docSnap.data();
    return NextResponse.json({
      success: true,
      preview: data,
    });
  } catch (error) {
    console.error("Failed to fetch preview data:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}
