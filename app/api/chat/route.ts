import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = fenced ? fenced[1] : text;
  const block = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(block ? block[0] : raw.trim());
}

export async function POST(req: NextRequest) {
  const { messages, caloriesConsumed, proteinConsumed } = await req.json().catch(() => ({}));

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 768,
      system: `You are a friendly, conversational nutrition assistant. The user is on a 1500 calorie, 170g protein daily plan. They have consumed ${caloriesConsumed ?? 0} kcal and ${proteinConsumed ?? 0}g protein so far today.

When the user describes food they have eaten, respond with this exact JSON:
{
  "message": "Warm, brief 1-2 sentence response",
  "macros": {
    "summary": "Short food description",
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "notes": "One helpful, encouraging tip"
  }
}

For follow-up additions like "I also had a coffee", estimate ONLY that additional food's macros.
When the user is chatting or asking questions (not describing food), respond with:
{
  "message": "Your friendly response"
}

Always return valid JSON. Never include markdown outside the JSON.`,
      messages,
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    try {
      const data = extractJson(raw);
      return NextResponse.json({ ...data, _raw: raw });
    } catch {
      return NextResponse.json({ message: raw, _raw: raw });
    }
  } catch (err) {
    console.error("Chat API error:", err);
    const apiMessage =
      err instanceof Error &&
      (err as Error & { error?: { error?: { message?: string } } }).error?.error?.message;
    const userMessage = apiMessage ?? (err instanceof Error ? err.message : "Failed to get response");
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
