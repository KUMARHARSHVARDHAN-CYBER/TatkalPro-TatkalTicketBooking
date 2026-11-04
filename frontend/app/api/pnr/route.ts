import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get("pnr") || "";

  if (!pnr || !/^\d{10}$/.test(pnr.trim())) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PNR",
          message: "PNR must be a valid 10-digit number.",
        },
      },
      { status: 400 }
    );
  }

  const booking = await railwayProvider.getPNRStatus(pnr.trim());
  if (!booking) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PNR_NOT_FOUND",
          message: "No booking record located for this PNR.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: booking,
  });
}

