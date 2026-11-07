import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";
import { QuotaCode, TravelClassCode } from "@/lib/railway/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainNumber, journeyDate, classCode, quota, seatCount = 1 } = body;

    if (!trainNumber || !journeyDate || !classCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Missing required booking hold parameters (trainNumber, journeyDate, classCode).",
          },
        },
        { status: 400 }
      );
    }

    const hold = await railwayProvider.holdSeats({
      trainNumber,
      journeyDate,
      classCode: classCode as TravelClassCode,
      quota: (quota || "TATKAL") as QuotaCode,
      seatCount: Number(seatCount),
      ttlSeconds: 480, // 8 minutes seat hold timer
    });

    return NextResponse.json({
      success: true,
      message: `Seats held for 8 minutes in Redis memory buffer. Complete your booking before countdown expires.`,
      data: hold,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEAT_HOLD_FAILED",
          message: error.message || "Failed to secure seat hold.",
        },
      },
      { status: 409 }
    );
  }
}

