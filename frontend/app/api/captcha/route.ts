import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Generate random 5-character alphanumeric captcha excluding ambiguous chars (0, O, 1, I)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let captchaCode = "";
  for (let i = 0; i < 5; i++) {
    captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const captchaToken = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // SVG representation with noise & distortion lines
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50">
      <rect width="100%" height="100%" fill="#0a192f"/>
      <line x1="10" y1="20" x2="150" y2="35" stroke="#f97316" stroke-width="1.5" opacity="0.4"/>
      <line x1="20" y1="40" x2="140" y2="10" stroke="#38bdf8" stroke-width="1.5" opacity="0.4"/>
      <text x="25" y="34" font-family="monospace" font-size="26" font-weight="bold" fill="#ffffff" letter-spacing="8">
        ${captchaCode}
      </text>
    </svg>
  `.trim();

  // Audio pronunciation representation (spelled out for speech synthesis)
  const audioSpelling = captchaCode.split("").join(" ");

  return NextResponse.json({
    success: true,
    data: {
      captchaToken,
      captchaCode, // In real prod, keep hashed or verify on server
      svg,
      audioSpelling,
    },
  });
}

