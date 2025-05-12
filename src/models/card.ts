import { string, z } from "zod";

import { Request, Response } from "express";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { Database, Tables, TablesInsert } from "../supabase/types/supabase";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { createSupabaseClient} from './topics';
import openai from "../config/openai";

async function insertMultipleSelectionCardAnswers(token: string, card_id: string, correct_index: number, options : string[]) {
  const supabase = createSupabaseClient(token);
  
  const newSelectAnswers: TablesInsert<'select_answers'> =  {
    card_id,
    correct_index,
    options
}

const { data, error } = await supabase
    .from('select_answers')
    .insert(newSelectAnswers)
    .select()
    .single();
    
  return { data, error } as { data: Tables<'select_answers'> | null, error: PostgrestError | null };
}


async function insertFreeTextCardAnswers(token: string, card_id: string, correct_answer: string) {
  const supabase = createSupabaseClient(token);
  
  const newFreeTextAnswer: TablesInsert<'free_text_answers'> =  {
    card_id,
    correct_answer
}

const { data, error } = await supabase
    .from('free_text_answers')
    .insert(newFreeTextAnswer)
    .select()
    .single();
    
  return { data, error } as { data: Tables<'free_text_answers'> | null, error: PostgrestError | null };
}

async function insertCard(token: string, question: string, answer_type: string, subtopic_id : string) {
  const supabase = createSupabaseClient(token);
  
  const newCard: TablesInsert<'cards'> =  {
    answer_type,
    question,
    subtopic_id
};

const { data, error } = await supabase
    .from('cards')
    .insert(newCard)
    .select()
    .single();
    
  return { data, error } as { data: Tables<'cards'> | null, error: PostgrestError | null };
}

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

  const result = MultipleChoiceCardsSchema.safeParse(JSON.parse(raw));

  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error("Invalid response format from OpenAI.");
  }

  return result.data;
}
catch (error) {
    console.log(error.error);
    throw error;
}
}

export async function insertGeneratedCards(req: Request, res: Response,  cards: z.infer<typeof MultipleChoiceCardsSchema>) 
{

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: no token provided" });
    }


  for (const card of cards.cards) 
  {
    const { data: cardData, error: cardError } = await insertCard(token, card.question, "select", card.topic);

    if (cardError || !cardData) {
      console.error("Failed to insert card:", cardError);
      continue;
    }

    const card_id = cardData.id;

    const { error: answerError } = await insertMultipleSelectionCardAnswers(
      token,
      card_id,
      card.correctAnswerIndex,
      card.options
    );

    if (answerError) {
      console.error("Failed to insert answer for card:", card_id, answerError);
    }
  }
}