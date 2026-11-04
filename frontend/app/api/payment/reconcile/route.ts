import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId = "TXN_MOCK" } = body;

    const reconciliation = await railwayProvider.reconcileAndRefund(transactionId);

    return NextResponse.json({
      success: true,
      message: "Reconciliation complete. Refund dispatched.",
      data: reconciliation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RECONCILIATION_ERROR",
          message: error.message || "Failed to reconcile payment.",
        },
      },
      { status: 500 }
    );
  }
}

