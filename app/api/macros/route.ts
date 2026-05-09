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
  const { transcript } = await req.json().catch(() => ({}));

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `The user is on a 1500 calorie, 170g protein daily plan. They just told you what they ate:
"${transcript}"
Estimate the macros and return JSON only:
{
  "summary": "2 scrambled eggs, toast, coffee with milk",
  "calories": 420,
  "protein": 18,
  "carbs": 35,
  "fat": 16,
  "notes": "Protein is a bit low for this meal — consider adding a side of Greek yogurt next time"
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const data = extractJson(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Macros API error:", err);
    return NextResponse.json({ error: "Failed to estimate macros" }, { status: 500 });
  }
}
