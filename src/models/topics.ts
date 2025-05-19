import { Request, Response } from "express";
import { PostgrestError } from "@supabase/supabase-js";
import { Tables, TablesInsert } from "../supabase/types/supabase";
import { createSupabaseClient } from "../supabase/client";
import { QueryResult, QueryData, QueryError } from "@supabase/supabase-js";

// Inserts row into topic table
async function insertTopic(token: string, title: string) {
    const supabase = createSupabaseClient(token);

    const newTopic: TablesInsert<"topics"> = {
        title,
        // created_at is optional as it has a default value in schema
    };

    const { data, error } = await supabase
        .from("topics")
        .insert(newTopic)
        .select()
        .single();

    return { data, error } as {
        data: Tables<"topics"> | null;
        error: PostgrestError | null;
    };
}

// Adds new row to topic table, returns data on new topic OR data of topic if that topic title already exists
async function createNewTopic(token: string, title: string) {
    try {
        // Validate input
        if (!title.trim()) {
            throw new Error("Topic title cannot be empty");
        }

        let result = await insertTopic(token, title);

        if (result.error) {
            // Handle Supabase error
            if (result.error.code === "23505") {
                result = await getTopicByTitle(token, title);
            } else {
                throw new Error(`Database error: ${result.error.message}`);
            }
        }

        if (!result.data) {
            throw new Error("Topic was not created");
        }

        return result.data as Tables<"topics">;
    } catch (err) {
        console.error("Failed to create topic:", err);
        throw err;
    }
}

// ENTRY POINT FROM TOPIC CONTROLLER
// Adds new row to topic_styles table AND adds new row to topic table if one does not exist
export async function createUserTopic(
    token: string,
    title: string,
    design: string,
    colour: string,
) {
    const supabase = createSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const topicInsertData = await createNewTopic(token, title);
    console.log("inUserTopic ", topicInsertData);

    const newTopicStyle: TablesInsert<"topic_styles"> = {
        user_id: userData.user.id,
        colour: colour,
        design: design,
        topic_id: topicInsertData.id,
    };

    const { data: topicData, error: topicError } = await supabase
        .from("topic_styles")
        .insert(newTopicStyle)
        .select()
        .single();

    return { data: topicData, error: topicError } as {
        data: Tables<"topic_styles"> | null;
        error: PostgrestError | null;
    };
}

export async function getTopicByTitle(token: string, title: string) {
    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("title", title)
        .single();

    return { data, error } as {
        data: Tables<"topics"> | null;
        error: PostgrestError | null;
    };
}

// ENTRY POINT FROM TOPIC CONTROLLER
export async function getUserTopics(token: string) {
    const supabase = createSupabaseClient(token);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userTopicsQuery = supabase
        .from("topic_styles")
        .select(
            `
    *,
    topics (*)
  `,
        )
        .eq("user_id", user.id);
    type UserTopics = QueryData<typeof userTopicsQuery>;

    const { data, error } = await userTopicsQuery;
    if (error) throw error;

    return { userTopics: data, error } as {
        userTopics: UserTopics | null;
        error: PostgrestError | null;
    };
}
