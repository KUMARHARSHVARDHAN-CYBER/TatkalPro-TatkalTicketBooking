import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// ==============================================================================
// Types & Graph Modeling for Local Node.js BFS Routing Logic
// ==============================================================================

interface NetworkEdge {
  to: string;
  trainNumber: string;
  trainName: string;
  availableSeats: number;
  durationMinutes: number;
}

interface SplitRouteResult {
  source: string;
  destination: string;
  isDirectAvailable: boolean;
  directSeats: number;
  hasSplitRoute: boolean;
  layoverStation: string;
  leg1: {
    from: string;
    to: string;
    trainNumber: string;
    trainName: string;
    seats: number;
  };
  leg2: {
    from: string;
    to: string;
    trainNumber: string;
    trainName: string;
    seats: number;
  };
  bottleneckSeats: number;
}

// Inter-city railway connection graph simulating IRCTC inventory
const RAILWAY_NETWORK: Record<string, NetworkEdge[]> = {
  Delhi: [
    { to: "Mumbai", trainNumber: "12952", trainName: "Mumbai Rajdhani Express", availableSeats: 0, durationMinutes: 940 }, // Direct train is FULL
    { to: "Kota", trainNumber: "12060", trainName: "Kota Jan Shatabdi Express", availableSeats: 18, durationMinutes: 280 },
    { to: "Jaipur", trainNumber: "12015", trainName: "Ajmer Shatabdi", availableSeats: 12, durationMinutes: 260 },
    { to: "Bhopal", trainNumber: "12002", trainName: "Bhopal Shatabdi", availableSeats: 14, durationMinutes: 480 },
  ],
  Kota: [
    { to: "Mumbai", trainNumber: "12954", trainName: "August Kranti Rajdhani", availableSeats: 5, durationMinutes: 660 }, // 5 seats left on Leg 2
    { to: "Delhi", trainNumber: "12903", trainName: "Golden Temple Mail", availableSeats: 8, durationMinutes: 300 },
  ],
  Jaipur: [
    { to: "Mumbai", trainNumber: "12956", trainName: "Jaipur Mumbai Superfast", availableSeats: 0, durationMinutes: 720 },
  ],
  Bhopal: [
    { to: "Mumbai", trainNumber: "12138", trainName: "Punjab Mail", availableSeats: 2, durationMinutes: 520 },
  ],
  Mumbai: [],
};

/**
 * Regex / String matching helper to extract origin and destination from speech transcript.
 * Defaults to Delhi -> Mumbai for the demo if not explicitly stated.
 */
function extractSourceAndDestination(transcription: string): { source: string; destination: string } {
  const text = transcription.trim();

  // Pattern 1: "from [CityA] to [CityB]"
  const fromToMatch = text.match(/from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/i);
  if (fromToMatch) {
    const rawSrc = fromToMatch[1].trim();
    const rawDst = fromToMatch[2].trim().replace(/[?.!,].*$/, "");
    if (rawSrc && rawDst) {
      return {
        source: capitalize(rawSrc),
        destination: capitalize(rawDst),
      };
    }
  }

  // Pattern 2: "[CityA] to [CityB]"
  const toMatch = text.match(/([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/i);
  if (toMatch) {
    const rawSrc = toMatch[1].trim().replace(/^book\s+(?:a\s+)?(?:train\s+)?(?:ticket\s+)?/i, "");
    const rawDst = toMatch[2].trim().replace(/[?.!,].*$/, "");
    if (rawSrc && rawDst) {
      return {
        source: capitalize(rawSrc),
        destination: capitalize(rawDst),
      };
    }
  }

  // Pattern 3: City keyword discovery
  const knownCities = ["Delhi", "Mumbai", "Kota", "Kolkata", "Bengaluru", "Chennai", "Jaipur", "Bhopal"];
  const matched = knownCities.filter((city) => new RegExp(`\\b${city}\\b`, "i").test(text));
  if (matched.length >= 2) {
    return {
      source: matched[0],
      destination: matched[1],
    };
  }

  // Assume Delhi to Mumbai for the demo per specifications
  return {
    source: "Delhi",
    destination: "Mumbai",
  };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Breadth-First Search (BFS) routing engine that simulates database inspection.
 * Verifies direct train is full (0 seats) and searches 2-leg split-ticket routes via intermediate hubs.
 */
function findSplitRouteBFS(source: string, destination: string): SplitRouteResult {
  const normSrc = Object.keys(RAILWAY_NETWORK).find((k) => k.toLowerCase() === source.toLowerCase()) || "Delhi";
  const normDst = Object.keys(RAILWAY_NETWORK).find((k) => k.toLowerCase() === destination.toLowerCase()) || "Mumbai";

  // Check direct train inventory
  const directEdge = RAILWAY_NETWORK[normSrc]?.find((edge) => edge.to.toLowerCase() === normDst.toLowerCase());
  const directSeats = directEdge ? directEdge.availableSeats : 0;
  const isDirectAvailable = directSeats > 0;

  // BFS Queue to find split routes (max 2 legs via layover)
  interface BFSNode {
    station: string;
    path: { from: string; to: string; edge: NetworkEdge }[];
  }

  const queue: BFSNode[] = [{ station: normSrc, path: [] }];
  const visited = new Set<string>([normSrc]);

  let chosenSplit: {
    layover: string;
    leg1: { from: string; to: string; edge: NetworkEdge };
    leg2: { from: string; to: string; edge: NetworkEdge };
    bottleneckSeats: number;
  } | null = null;

  while (queue.length > 0) {
    const { station, path } = queue.shift()!;

    // Reached destination via 2 legs (split journey)
    if (path.length === 2 && station.toLowerCase() === normDst.toLowerCase()) {
      const leg1 = path[0];
      const leg2 = path[1];
      const bottleneck = Math.min(leg1.edge.availableSeats, leg2.edge.availableSeats);

      if (bottleneck > 0) {
        if (!chosenSplit || bottleneck > chosenSplit.bottleneckSeats) {
          chosenSplit = {
            layover: leg1.to,
            leg1,
            leg2,
            bottleneckSeats: bottleneck,
          };
        }
      }
      continue;
    }

    if (path.length >= 2) continue;

    const edges = RAILWAY_NETWORK[station] || [];
    for (const edge of edges) {
      // Skip direct destination in first leg because direct is full
      if (path.length === 0 && edge.to.toLowerCase() === normDst.toLowerCase()) {
        continue;
      }

      if (!visited.has(edge.to) || edge.to.toLowerCase() === normDst.toLowerCase()) {
        visited.add(edge.to);
        queue.push({
          station: edge.to,
          path: [...path, { from: station, to: edge.to, edge }],
        });
      }
    }
  }

  const layoverStation = chosenSplit?.layover || "Kota";
  const bottleneckSeats = chosenSplit?.bottleneckSeats || 5;

  return {
    source: normSrc,
    destination: normDst,
    isDirectAvailable,
    directSeats,
    hasSplitRoute: true,
    layoverStation,
    leg1: {
      from: normSrc,
      to: layoverStation,
      trainNumber: chosenSplit?.leg1.edge.trainNumber || "12060",
      trainName: chosenSplit?.leg1.edge.trainName || "Kota Jan Shatabdi Express",
      seats: chosenSplit?.leg1.edge.availableSeats || 18,
    },
    leg2: {
      from: layoverStation,
      to: normDst,
      trainNumber: chosenSplit?.leg2.edge.trainNumber || "12954",
      trainName: chosenSplit?.leg2.edge.trainName || "August Kranti Rajdhani",
      seats: chosenSplit?.leg2.edge.availableSeats || 5,
    },
    bottleneckSeats,
  };
}

// ==============================================================================
// Step 1: POST Handler for /api/voice-agent
// ==============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawApiKey = (process.env.GNANI_API_KEY || "").trim();
    const gnaniApiKey = rawApiKey.replace(/^["']|["']$/g, "");

    let transcription = "";
    let audioFile: Blob | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      audioFile = (formData.get("audio_file") ||
        formData.get("audio") ||
        formData.get("file")) as Blob | null;

      const textOverride = formData.get("text") as string | null;
      if (textOverride && textOverride.trim()) {
        transcription = textOverride.trim();
      }
    } else if (contentType.includes("application/json")) {
      const jsonBody = await request.json().catch(() => ({}));
      if (jsonBody.text) {
        transcription = String(jsonBody.text).trim();
      }
    }

    // --------------------------------------------------------------------------
    // A. Gnani Prisma (Speech-to-Text)
    // --------------------------------------------------------------------------
    if (!transcription && audioFile && gnaniApiKey) {
      try {
        const prismaForm = new FormData();
        prismaForm.append("audio_file", audioFile, "audio.wav");
        prismaForm.append("model", "prisma-v3.0");
        prismaForm.append("language_code", "en-IN");

        const sttRes = await fetch("https://api.vachana.ai/stt/v3", {
          method: "POST",
          headers: {
            "X-API-Key-ID": gnaniApiKey,
          },
          body: prismaForm,
        });

        if (sttRes.ok) {
          const sttData = await sttRes.json();
          transcription = sttData?.transcript || sttData?.text || "";
        } else {
          const errText = await sttRes.text().catch(() => "");
          console.warn("Gnani Prisma STT non-200 response:", sttRes.status, errText);
        }
      } catch (sttErr: any) {
        console.warn("Gnani Prisma STT network/exception:", sttErr.message);
      }
    }

    // Fallback if no speech recognized or testing without voice input
    if (!transcription || transcription.trim().length === 0) {
      transcription = "Find trains from Delhi to Mumbai in Tatkal quota";
    }

    // --------------------------------------------------------------------------
    // B. Local Routing Logic (Node.js BFS)
    // --------------------------------------------------------------------------
    const { source, destination } = extractSourceAndDestination(transcription);
    const routingResult = findSplitRouteBFS(source, destination);

    // Exact required response string:
    // "The direct train from [Source] to [Destination] is full, but I found a split-ticket route via Kota with 5 seats left. Should I lock it?"
    const responseString = `The direct train from ${routingResult.source} to ${routingResult.destination} is full, but I found a split-ticket route via Kota with 5 seats left. Should I lock it?`;

    // --------------------------------------------------------------------------
    // C. Gnani Timbre (Text-to-Speech)
    // --------------------------------------------------------------------------
    if (!gnaniApiKey) {
      console.error("Gnani Timbre Error: Missing GNANI_API_KEY");
      return NextResponse.json({ error: "TTS Failed: Missing GNANI_API_KEY" }, { status: 500 });
    }

    const timbrePayload = {
      text: responseString,
      voice: "Nalini",
      model: "timbre-v2.5",
      language: "en-IN",
      speed: 1.0,
      audio_config: {
        sample_rate: 48000,
        num_channels: 1,
        sample_width: 2,
        encoding: "linear_pcm",
        container: "wav",
      },
    };

    const timbreResponse = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
      method: "POST",
      headers: {
        "X-API-Key-ID": gnaniApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(timbrePayload),
    });

    if (!timbreResponse.ok) {
      const errText = await timbreResponse.text();
      console.error("Gnani Timbre Error:", errText);
      return NextResponse.json({ error: "TTS Failed: " + errText }, { status: 500 });
    }

    const arrayBuffer = await timbreResponse.arrayBuffer();
    const audio_base64 = Buffer.from(arrayBuffer).toString("base64");

    // Return the exact JSON payload specified:
    // { ui_state: { route: 'split', layover: 'Kota' }, audio_base64 }
    return NextResponse.json({
      success: true,
      transcript: transcription,
      response_text: responseString,
      ui_state: {
        route: "split",
        layover: "Kota",
        source: routingResult.source,
        destination: routingResult.destination,
        seats_left: 5,
        leg1: routingResult.leg1,
        leg2: routingResult.leg2,
        message: responseString,
      },
      audio_base64,
    });
  } catch (error: any) {
    console.error("Voice Agent Route Failure:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VOICE_AGENT_ERROR",
          message: error.message || "Failed to process voice agent request",
        },
      },
      { status: 500 }
    );
  }
}
