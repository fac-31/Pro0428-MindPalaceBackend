import { string, z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import openai from "../config/openai";

// 1) Define your Zod schemas
const UUIDSchema = z.string().uuid();

/*
const TextAndImageComponentSchema = z.object({
  text: z.string(),
  imageURL: z.string().url().optional(),
});

const MultipleChoiceCardSchema = z.object({
  question: TextAndImageComponentSchema,
  level: z.number().int().optional(),
  topic: z.string(),
  subtopic: z.string(),
  user: UUIDSchema.optional(),
  options: TextAndImageComponentSchema.array().length(4),
  correctAnswerIndex: z.number().int().min(0).max(3),
});
*/

const MultipleChoiceCardSchema = z.object({
    question: z.string(),
    topic:    z.string(),
    options:  z.array(z.string()),
    correctAnswerIndex: z.number().int()
  });

export const MultipleChoiceCardsSchema = z.object({ cards: z.array(MultipleChoiceCardSchema) });



export async function generateCardsModel() {
    console.log("entered model");
    try {

    
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are a quiz generator model. Generate exactly 3 MultipleChoiceCard objects.
Each card must match this TypeScript interface:

interface MultipleChoiceCard {
  question: string;
  topic: string;
  options: Array<{ text: string; }>;
  correctAnswerIndex: number;    // 0–3
}
        the options is an array of 4 possible answers. correctAnswerIndex specifies the correct answer index.

`.trim(),
      },
      {
        role: "user",
        content: "Generate cards that test my knowledge on driving theory.",
      },
    ],
    // 2) Wire up the JSON-Schema you got from Zod:
    response_format:zodResponseFormat(MultipleChoiceCardsSchema, "cards"),
  });

  // 1. Grab the JSON‐string from .content
  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("No content returned");

  console.log(raw);
  const parsed = JSON.parse(raw);
  console.dir(parsed, { depth: null });
  return parsed; 
}
catch (error) {
    console.log(error.error);
    throw error;
}
}
