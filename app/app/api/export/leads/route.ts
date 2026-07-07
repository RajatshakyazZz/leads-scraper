import { NextResponse } from "next/server";
import { AuthRequestError, verifyRequestUser } from "@/lib/firebase-admin";
import { getSavedLeads, leadsToCsv, uploadCsvExport } from "@/lib/user-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const decoded = await verifyRequestUser(req);
    const leads = await getSavedLeads(decoded.uid);
    const csv = leadsToCsv(leads);
    const storagePath = await uploadCsvExport(decoded.uid, csv);

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="lead-to-launch-leads.csv"`,
        ...(storagePath ? { "x-firebase-storage-path": storagePath } : {}),
      },
    });
  } catch (e) {
    if (e instanceof AuthRequestError) {
      return NextResponse.json({ code: e.code, error: e.message }, { status: e.status });
    }

    return NextResponse.json({ code: "EXPORT_ERROR", error: "Unable to export saved leads." }, { status: 500 });
  }
}
