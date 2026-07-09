import "server-only";
import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getSavedLeads, leadsToCsv, uploadCsvExport, getSessionDetail, getUserSessions } from "@/lib/user-data";
import type { Lead } from "@/lib/types";

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
  const sessionId = searchParams.get("sessionId");
  const sessionIdsParam = searchParams.get("sessionIds");

  try {
    let leads: Lead[] = [];
    let audits: Record<string, any> = {};
    let rankings: Record<string, any> = {};
    let builds: Record<string, any> = {};
    let outreach: Record<string, any> = {};
    let metadata: Record<string, any> = {};

    if (sessionId) {
      // Export single session
      const detail = await getSessionDetail(decoded.uid, sessionId);
      if (detail) {
        leads = detail.leads;
        audits = detail.audits;
        rankings = detail.rankings;
        builds = detail.builds;
        outreach = detail.outreach;
        metadata = {
          sessionId: detail.session.id,
          niche: detail.session.niche,
          city: detail.session.city
        };
      }
    } else if (sessionIdsParam) {
      // Export multiple sessions
      const ids = sessionIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const details = await Promise.all(ids.map((id) => getSessionDetail(decoded.uid, id)));
      
      details.forEach((detail) => {
        if (!detail) return;
        leads = [...leads, ...detail.leads];
        Object.assign(audits, detail.audits);
        Object.assign(rankings, detail.rankings);
        Object.assign(builds, detail.builds);
        Object.assign(outreach, detail.outreach);
      });
    } else {
      // Export entire account (all sessions)
      const { sessions } = await getUserSessions(decoded.uid, { limit: 100 });
      if (sessions.length > 0) {
        const details = await Promise.all(sessions.map((s) => getSessionDetail(decoded.uid, s.id)));
        details.forEach((detail) => {
          if (!detail) return;
          leads = [...leads, ...detail.leads];
          Object.assign(audits, detail.audits);
          Object.assign(rankings, detail.rankings);
          Object.assign(builds, detail.builds);
          Object.assign(outreach, detail.outreach);
        });
      } else {
        // Fallback to legacy leads if no sessions exist
        leads = await getSavedLeads(decoded.uid);
      }
    }

    const csv = leadsToCsv(leads, audits, rankings, builds, outreach, metadata);
    
    // Attempt storage upload in background (non-blocking)
    const storagePath = await uploadCsvExport(decoded.uid, csv);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="lead-to-launch-export.csv"`,
        ...(storagePath ? { "x-firebase-storage-path": storagePath } : {}),
      },
    });
  } catch (e) {
    console.error("Export CSV failed:", e);
    return NextResponse.json({ code: "EXPORT_ERROR", error: `Unable to export saved leads: ${(e as Error).message}` }, { status: 500 });
  }
}
