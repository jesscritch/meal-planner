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
  const { caloriesConsumed, proteinConsumed, timeOfDay } = await req.json().catch(() => ({}));

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
          content: `The user's daily goals are 1500 calories and 170g protein.
So far today they have consumed ${caloriesConsumed} calories and ${proteinConsumed}g protein.
It is currently ${timeOfDay} (morning/afternoon/evening).
Suggest 2-3 specific meals or snacks for the rest of the day to hit their goals.
Return JSON only:
{
  "remaining": { "calories": 900, "protein": 112 },
  "suggestions": [
    { "meal": "Grilled chicken breast with rice", "calories": 450, "protein": 55, "reason": "High protein to close the gap" },
    { "meal": "Greek yogurt with berries", "calories": 200, "protein": 18, "reason": "Light snack, hits remaining protein" }
  ]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const data = extractJson(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Suggestions API error:", err);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
