import { NextRequest, NextResponse } from "next/server";
import { railwayProvider } from "@/lib/railway/adapter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const lang = (searchParams.get("lang") as "en" | "hi") || "en";

  try {
    const stations = await railwayProvider.searchStations(q, lang);
    return NextResponse.json({ success: true, data: stations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to search stations" } },
      { status: 500 }
    );
  }
}

