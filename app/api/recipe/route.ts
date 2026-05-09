import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export interface RecipeData {
  cookTime: string;
  ingredients: string[];
  instructions: string[];
}

function extractJson(text: string): RecipeData {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = fenced ? fenced[1] : text;
  // Extract first {...} block as a fallback
  const block = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(block ? block[0] : raw.trim());
}

export async function POST(req: NextRequest) {
  const { mealName } = await req.json().catch(() => ({}));

  if (!mealName || typeof mealName !== "string") {
    return NextResponse.json({ error: "mealName required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a helpful nutrition-focused cooking assistant. The user is on a 1500 calorie, 170g protein daily meal plan.
Generate a detailed recipe for: "${mealName}"
Return JSON only in this exact format:
{
  "cookTime": "20 minutes",
  "ingredients": ["150g chicken breast", "1 cup broccoli"],
  "instructions": ["Step 1...", "Step 2..."]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const data = extractJson(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Recipe API error:", err);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}
