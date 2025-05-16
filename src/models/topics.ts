import { Request, Response } from "express";
import { PostgrestError } from "@supabase/supabase-js";
import { Tables, TablesInsert } from "../supabase/types/supabase";
import { createSupabaseClient } from "../supabase/client";
import { QueryResult, QueryData, QueryError } from "@supabase/supabase-js";

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

// Inserts row into topic table
export async function insertTopic(token: string, title: string) {
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
export async function createNewTopic(token: string, title: string) {
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

// Adds new row to topic_styles table AND adds new row to topic table if one does not exist
async function createUserTopic(
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

export async function createNewSubtopic(
    token: string,
    title: string,
    topicId: string,
    design: string,
    colour: string,
) {

    console.log(token);
    console.log(title);
    console.log(topicId);
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

export async function getTopics(token: string) {
    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase.from("topics").select("*");

    return { alltopics: data, error } as {
        alltopics: Tables<"topics">[] | null;
        error: PostgrestError | null;
    };
}


export async function getTopicById(token: string, id: string) {
    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .single();

    return { topic: data, error } as {
        topic: Tables<"topics"> | null;
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

async function getUserTopics(token: string) {
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

export async function getTopicsModel(req: Request, res: Response) {
    console.log("entered topic model");
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ error: "Unauthorized: no token provided" });
        }

        //and so forth... (note: if you create a topic with an existing name an error will be returned)
        //const newTopic = await createNewTopic(token, "ninth");

        const { userTopics, error } = await getUserTopics(token);

        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(userTopics);
    } catch (error: any) {
        console.error("Unhandled error in getTopicsModel:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// Function entry point for adding new Topics
export async function addTopicModel(req: Request, res: Response) {
    console.log("entered add topic model");
    try {
        // Get Auth
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ error: "Unauthorized: no token provided" });
        }

        const { title, design, colour } = req.body;

        const { data: topicData, error } = await createUserTopic(
            token,
            title,
            design,
            colour,
        );

        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(topicData);
    } catch (error: any) {
        console.error("Unhandled error in getTopicsModel:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
