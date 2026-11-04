import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";
import { QuotaCode } from "@/lib/railway/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "NDLS";
  const to = searchParams.get("to") || "MMCT";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const quota = (searchParams.get("quota") as QuotaCode) || "TATKAL";

  try {
    const trains = await railwayProvider.searchTrains(from, to, date, quota);
    return NextResponse.json({
      success: true,
      meta: { from, to, date, quota, count: trains.length },
      data: trains,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to search trains" } },
      { status: 500 }
    );
  }
}

