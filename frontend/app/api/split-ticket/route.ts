import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";
import { QuotaCode } from "@/lib/railway/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "NDLS";
  const to = searchParams.get("to") || "MMCT";
  const quota = (searchParams.get("quota") as QuotaCode) || "TATKAL";

  try {
    const alternatives = await railwayProvider.findSplitTicketAlternatives(from, to, quota);
    return NextResponse.json({
      success: true,
      meta: { from, to, count: alternatives.length },
      data: alternatives,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Failed to calculate split-ticket alternatives" },
      },
      { status: 500 }
    );
  }
}

