import { Request, Response } from "express";
import { PostgrestError } from "@supabase/supabase-js";
import { Tables, TablesInsert } from "../supabase/types/supabase";
import { createSupabaseClient } from "../supabase/client";

export async function insertSubtopic(
    token: string,
    title: string,
    topicId: string,
    design: string,
    colour: string,
) {
    const supabase = createSupabaseClient(token);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const newSubtopic: TablesInsert<"subtopics"> = {
        user_id: user.id,
        title,
        topic_id: topicId,
        design,
        colour,
    };

    const { data, error } = await supabase
        .from("subtopics")
        .insert(newSubtopic)
        .select()
        .single();

    return { data, error } as {
        data: Tables<"subtopics"> | null;
        error: PostgrestError | null;
    };
}

export async function createNewSubtopic(
    token: string,
    title: string,
    topicId: string,
    design: string,
    colour: string,
) {

    try {
        // Validate input
        if (!title.trim()) {
            throw new Error("Subtopic title cannot be empty");
        }

        const result = await insertSubtopic(
            token,
            title,
            topicId,
            design,
            colour,
        );

        if (result.error) {
            // Handle Supabase error
            if (result.error.code === "23505") {
                throw new Error(
                    "A Subtopic with this title for this user already exists",
                );
            } else {
                throw new Error(`Database error: ${result.error.message}`);
            }
        }

        if (!result.data) {
            throw new Error("Sub was not created");
        }

        return result.data as Tables<"subtopics">;
    } catch (err) {
        console.error("Failed to create subtopic:", err);
        throw err;
    }
}

export async function getSubtopicByTopicId(token: string, id: string) {
    const supabase = createSupabaseClient(token);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("subtopics")
        .select("*")
        .eq("topic_id", id)
        .eq("user_id", user.id);

    return { subtopics: data, error } as {
        subtopics: Tables<"subtopics">[] | null;
        error: PostgrestError | null;
    };
}

export async function getSubtopicByTopicIdAndSubtopicTitle(
    token: string,
    topic_id: string,
    subtopic_title: string,
) {
    const supabase = createSupabaseClient(token);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("subtopics")
        .select("*")
        .eq("topic_id", topic_id)
        .eq("title", subtopic_title)
        .eq("user_id", user.id)
        .single();

    return { subtopic: data, error } as {
        subtopic: Tables<"subtopics"> | null;
        error: PostgrestError | null;
    };
}
