import { NextResponse } from "next/server";
import { processAiQuery } from "./engine";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "TCAS DW AI Assistant",
    hasServerApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message?.trim();
    const apiKey = body.apiKey?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await processAiQuery(message, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
