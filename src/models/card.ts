import { string, z } from "zod";
import { User } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { PostgrestError } from "@supabase/supabase-js";
import { Tables, TablesInsert } from "../supabase/types/supabase";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { createSupabaseClient } from "../supabase/client";
import openai from "../config/openai";

// Extended card type with answers
type CardWithAnswers = Tables<'cards'> & {
  answers: Tables<'select_answers'> | Tables<'free_text_answers'>;
};

async function insertMultipleSelectionCardAnswers(
    token: string,
    card_id: string,
    correct_index: number,
    options: string[],
) {
    const supabase = createSupabaseClient(token);

    const newSelectAnswers: TablesInsert<"select_answers"> = {
        card_id,
        correct_index,
        options,
    };

    const { data, error } = await supabase
        .from("select_answers")
        .insert(newSelectAnswers)
        .select()
        .single();

    return { data, error } as {
        data: Tables<"select_answers"> | null;
        error: PostgrestError | null;
    };
}

async function insertFreeTextCardAnswers(
    token: string,
    card_id: string,
    correct_answer: string,
) {
    const supabase = createSupabaseClient(token);

    const newFreeTextAnswer: TablesInsert<"free_text_answers"> = {
        card_id,
        correct_answer,
    };

    const { data, error } = await supabase
        .from("free_text_answers")
        .insert(newFreeTextAnswer)
        .select()
        .single();

    return { data, error } as {
        data: Tables<"free_text_answers"> | null;
        error: PostgrestError | null;
    };
}

async function insertCard(
    token: string,
    question: string,
    answer_type: string,
    subtopic_id: string,
) {
    const supabase = createSupabaseClient(token);

    const level: number = 1;
    const newCard: TablesInsert<"cards"> = {
        question,
        answer_type,
        subtopic_id,
        level,
    };
    const { data, error } = await supabase
        .from("cards")
        .insert(newCard)
        .select()
        .single();

    if (error) {
        console.error("Insert error:", error);
        throw new Error(`Failed to insert card: ${error.message}`);
    }

    return { data, error } as {
        data: Tables<"cards"> | null;
        error: PostgrestError | null;
    };
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
    topic: z.string(),
    options: z.array(z.string()),
    correctAnswerIndex: z.number().int(),
});

export const MultipleChoiceCardsSchema = z.object({
    cards: z.array(MultipleChoiceCardSchema),
});

export async function generateCardsModel(topic : string, subtopic : string) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `
You are a quiz generator model. Generate exactly 10 MultipleChoiceCard objects.
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
                    content:
                        `Generate cards that test my knowledge on the topic of ${topic} in the specific sub-topic of ${subtopic}.`,
                },
            ],
            // 2) Wire up the JSON-Schema you got from Zod:
            response_format: zodResponseFormat(
                MultipleChoiceCardsSchema,
                "cards",
            ),
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
    } catch (error) {
        console.log(error.error);
        throw error;
    }
}

export async function insertGeneratedCards(
    token: string,
    cards: z.infer<typeof MultipleChoiceCardsSchema>,
    topic: Tables<"topics">,
    subtopic: Tables<"subtopics">,
) : Promise<CardWithAnswers[]> {

    // Combine cards with their answers
    const cardsWithAnswers: CardWithAnswers[] = [];

    for (const card of cards.cards) 
      {
        const { data: cardData, error: cardError } = await insertCard(
            token,
            card.question,
            "select",
            subtopic.id,
        );

        if (cardError || !cardData) {
            console.error("Failed to insert card:", cardError);
            continue;
        }

        const card_id = cardData.id;

        const { data : answers , error: answerError } = await insertMultipleSelectionCardAnswers(
            token,
            card_id,
            card.correctAnswerIndex,
            card.options,
        );

        if (answerError) {
            console.error(
                "Failed to insert answer for card:",
                card_id,
                answerError,
            );
        }
        cardsWithAnswers.push({
          ...cardData,
          answers
        });
    }
    return cardsWithAnswers;
}


export async function getCardsModel(
  token: string, 
  topicId: string, 
  subtopicTitle: string
): Promise<Tables<'cards'>[]> {
  try {
    const supabase = createSupabaseClient(token);

    //select all columns from the cards table
    //inner join with the subtopic related table returns only card that have a matching subtopic id
    //supabase knows this because of the foreign key defintion : 
    //constraint cards_subtopic_id_fkey foreign KEY (subtopic_id) references subtopics (id)
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,                      
        subtopics!inner()       
      `)
      .eq('subtopics.topic_id', topicId)
      .eq('subtopics.title', subtopicTitle);        //all rows that have common subtopic title - they may have distinc subtopic_id - per user.


    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

export async function getAnswers(
    token : string,
    cards : Tables<'cards'>[]) : Promise<CardWithAnswers[]>
{
    try
    {

    const supabase = createSupabaseClient(token);

    if (!cards.length) {
      return [];
    }

    // Separate cards by answer type
    const selectCards = cards.filter(card => card.answer_type === 'select');
    const freeTextCards = cards.filter(card => card.answer_type === 'free_text');
    
    // Get card IDs for batch queries
    const selectCardIds = selectCards.map(card => card.id);
    const freeTextCardIds = freeTextCards.map(card => card.id);
    
    // Batch query for select answers
    const selectAnswersPromise = selectCardIds.length > 0 
      ? supabase
          .from('select_answers')
          .select('*')
          .in('card_id', selectCardIds)
      : Promise.resolve({ data: [], error: null });
    
    // Batch query for free text answers
    const freeTextAnswersPromise = freeTextCardIds.length > 0
      ? supabase
          .from('free_text_answers')
          .select('*')
          .in('card_id', freeTextCardIds)
      : Promise.resolve({ data: [], error: null });
    
    // Execute both queries in parallel
    const [selectAnswersResult, freeTextAnswersResult] = await Promise.all([
      selectAnswersPromise,
      freeTextAnswersPromise
    ]);
    
    if (selectAnswersResult.error) {
      throw selectAnswersResult.error;
    }
    
    if (freeTextAnswersResult.error) {
      throw freeTextAnswersResult.error;
    }
    
    // Create maps for quick lookup
    const selectAnswersMap = new Map<string, Tables<'select_answers'>>();
    const freeTextAnswersMap = new Map<string, Tables<'free_text_answers'>>();
    
    selectAnswersResult.data?.forEach(answer => {
      selectAnswersMap.set(answer.card_id, answer);
    });
    
    freeTextAnswersResult.data?.forEach(answer => {
      freeTextAnswersMap.set(answer.card_id, answer);
    });
    
    // Combine cards with their answers
    const cardsWithAnswers: CardWithAnswers[] = [];
    
    for (const card of cards) {
      let answers: Tables<'select_answers'> | Tables<'free_text_answers'> | undefined;
      
      if (card.answer_type === 'select') {
        answers = selectAnswersMap.get(card.id);
      } else if (card.answer_type === 'free_text') {
        answers = freeTextAnswersMap.get(card.id);
      }
      
      if (answers) {
        cardsWithAnswers.push({
          ...card,
          answers
        });
      } else {
        console.warn(`No answers found for card ${card.id} with answer_type ${card.answer_type}`);
      }
    }
    
    return cardsWithAnswers;
    
  } catch (error) {
    console.error('Error fetching cards with answers:', error);
    throw error;
  }
}

export async function getMasteryByCardID(token: string, card_id: string) {
    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase
        .from("mastery")
        .select("*")
        .eq("card_id", card_id)
        .maybeSingle(); // Returns null if no records, no error

    return { data, error } as {
        data: Tables<"mastery"> | null;
        error: PostgrestError | null;
    };
}

export async function updateMastery(token: string, masteryData : Tables<"mastery"> ) {
    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase
        .from("mastery")
        .update(masteryData)
        .eq("id", masteryData.id)
        .select()
        .single();

    return { data, error } as {
        data: Tables<"mastery"> ;
        error: PostgrestError | null;
    };
}

export async function insertNewMastery(token: string, newData : TablesInsert<"mastery"> ) {

        const supabase = createSupabaseClient(token);
        const { data, error } = await supabase
            .from("mastery")
            .insert(newData)
            .select()
            .single();
        
        return { data, error };
}

export async function getUser(token: string) {
    const supabase = createSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return { 
            data: null, 
            error: authError || new Error('Not authenticated') 
        };
    }

    return { 
        data: user, 
        error: null 
    } as {
        data: User | null;
        error: AuthError | Error | null;
    };
}