import { NextRequest, NextResponse } from "next/server";
import { botShieldService } from "@/lib/railway/botShield";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId = "usr_guest", ipAddress = "127.0.0.1", deviceFingerprint = "fp_client", passId } = body;

    if (action === "ISSUE") {
      // Check rate limit on pass issuance
      const rateCheck = botShieldService.checkRateLimit(`queue_${ipAddress}`, 15, 60);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { success: false, error: { code: "RATE_LIMITED", message: rateCheck.reason } },
          { status: 429 }
        );
      }

      const pass = botShieldService.issueAdmissionPass(userId, ipAddress, deviceFingerprint);
      return NextResponse.json({
        success: true,
        message: "Waiting room pass issued with 5-minute single-use validity.",
        data: pass,
      });
    }

    if (action === "VERIFY") {
      const result = botShieldService.verifyAndConsumePass(passId, userId, ipAddress);
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: { code: "TOKEN_INVALID", message: result.reason } },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Pass successfully consumed.",
      });
    }

    return NextResponse.json({ success: false, error: { message: "Invalid action" } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

