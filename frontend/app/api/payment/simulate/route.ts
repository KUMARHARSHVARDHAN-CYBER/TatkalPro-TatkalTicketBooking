import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, method = "UPI", shouldFail = false, gateway = "UPI_INTENT" } = body;

    const transaction = await railwayProvider.simulatePayment({
      amount: Number(amount) || 1540,
      method,
      shouldFail: Boolean(shouldFail),
      gateway,
    });

    if (transaction.status === "FAILED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_GATEWAY_FAILURE",
            message: transaction.failureReason,
            transaction,
            nextAction: "Switch to secondary backup payment gateway or initiate auto-reconciliation.",
          },
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified by simulated banking switch.",
      data: transaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PAYMENT_PROCESSING_ERROR",
          message: error.message || "Failed to process simulated payment.",
        },
      },
      { status: 500 }
    );
  }
}

