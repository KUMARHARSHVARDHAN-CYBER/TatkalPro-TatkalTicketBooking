import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdToken, draft, payment } = body;

    if (!draft || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Incomplete booking payload. Draft and payment details are mandatory.",
          },
        },
        { status: 400 }
      );
    }

    if (payment.status !== "SUCCESS") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_NOT_VERIFIED",
            message: "Payment transaction has not succeeded. Cannot confirm booking.",
          },
        },
        { status: 402 }
      );
    }

    const booking = await railwayProvider.confirmBooking({
      holdToken: holdToken || "token_auto",
      draft,
      payment,
    });

    return NextResponse.json({
      success: true,
      message: "Tatkal ticket confirmed successfully. PNR issued.",
      data: booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BOOKING_CONFIRMATION_FAILED",
          message: error.message || "Failed to finalize booking.",
        },
      },
      { status: 500 }
    );
  }
}

