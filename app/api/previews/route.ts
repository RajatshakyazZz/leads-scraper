import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { RankedLead } from "@/lib/types";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lead: RankedLead = body.lead;

    if (!lead || !lead.name) {
      return NextResponse.json({ error: "Missing lead data" }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Generate clean persistent preview ID
    const nameSlug = slugify(lead.name) || "business";
    const shortId = lead.id ? lead.id.slice(-6) : Math.random().toString(36).substring(2, 8);
    const previewId = `${nameSlug}-${shortId}`;

    const previewRef = db.collection("published_previews").doc(previewId);
    const existing = await previewRef.get();

    const now = new Date().toISOString();

    if (existing.exists) {
      await previewRef.update({
        lead,
        updatedAt: now,
      });
    } else {
      await previewRef.set({
        id: previewId,
        lead,
        viewsCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      previewId,
      previewUrl: `/preview/${previewId}`,
    });
  } catch (error) {
    console.error("Failed to save published preview:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}
