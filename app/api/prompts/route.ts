import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import type { Lead } from "@/lib/types";
import { getSavedPrompts, saveWebsitePrompt } from "@/lib/user-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const prompts = await getSavedPrompts(decoded.uid);
    return NextResponse.json({ prompts });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    return NextResponse.json({ code: "PROMPTS_ERROR", error: "Unable to load saved prompts." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const body = (await req.json()) as { lead?: Lead; platform?: string; prompt?: string };

    if (!body.lead?.id || !body.lead.name || !body.platform || !body.prompt) {
      return NextResponse.json({ code: "BAD_INPUT", error: "Lead, platform, and prompt are required." }, { status: 400 });
    }

    const savedPrompt = await saveWebsitePrompt(decoded.uid, {
      lead: body.lead,
      platform: body.platform,
      prompt: body.prompt,
    });

    return NextResponse.json({ prompt: savedPrompt });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    return NextResponse.json({ code: "PROMPTS_ERROR", error: "Unable to save prompt." }, { status: 500 });
  }
}
