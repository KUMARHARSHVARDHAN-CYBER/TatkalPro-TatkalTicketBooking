import { NextRequest, NextResponse } from "next/server";
import { botShieldService } from "@/lib/railway/botShield";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const metrics = botShieldService.getTelemetryMetrics();
  return NextResponse.json({
    success: true,
    data: metrics,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, value, reason, thresholds } = body;

    if (action === "BLOCK") {
      botShieldService.blockEntity(value, reason || "Manual block via Admin Shield");
      return NextResponse.json({ success: true, message: `Entity ${value} added to blocklist.` });
    }

    if (action === "ALLOWLIST") {
      botShieldService.allowlistEntity(value);
      return NextResponse.json({ success: true, message: `Entity ${value} allowlisted.` });
    }

    if (action === "UPDATE_THRESHOLDS") {
      botShieldService.updateThresholds(thresholds);
      return NextResponse.json({ success: true, message: "Security thresholds updated." });
    }

    return NextResponse.json({ success: false, error: { message: "Invalid action" } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

