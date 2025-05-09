
import { Request, Response } from "express";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { Database, Tables, TablesInsert } from "../supabase/types/supabase";

function createSupabaseClient(token: string) {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}
async function insertTopic(token: string, title: string) {
  const supabase = createSupabaseClient(token);
  
  const newTopic: TablesInsert<'topics'> = {
    title,
    // created_at is optional as it has a default value in schema
  };

  const { data, error } = await supabase
    .from('topics')
    .insert(newTopic)
    .select()
    .single();
    
  return { data, error } as { data: Tables<'topics'> | null, error: PostgrestError | null };
}

async function createNewTopic(token: string, title: string) {
  try {
    // Validate input
    if (!title.trim()) {
      throw new Error("Topic title cannot be empty");
    }
    
    const result = await insertTopic(token, title);
    
    if (result.error) {
      // Handle Supabase error
      if (result.error.code === '23505') {
        throw new Error("A topic with this title already exists");
      } else {
        throw new Error(`Database error: ${result.error.message}`);
      }
    }
    
    if (!result.data) {
      throw new Error("Topic was not created");
    }
    
    return result.data as Tables<'topics'> 
  } catch (err) {
    console.error("Failed to create topic:", err);
    throw err;
  }
}

async function getTopics(token: string) 
{
  const supabase = createSupabaseClient(token);
  const { data, error } = await supabase
    .from('topics')
    .select('*');
    
    return { alltopics: data , error } as { alltopics: Tables<'topics'>[] | null, error: PostgrestError | null };
}

async function getTopicById(token: string, id: string) 
{
  const supabase = createSupabaseClient(token);
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single();
    
    return {  topic: data, error } as { topic : Tables<'topics'> | null, error: PostgrestError | null };
  }

const supabaseUrl = 'https://wkstbehsenrlwhtaqfgq.supabase.co'
export async function getTopicsModel(req: Request, res: Response) {
  
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: no token provided" });
      }
  
      //and so forth... (note: if you create a topic with an existing name an error will be returned)
      const newTopic = await createNewTopic(token, "ninth");
      
      const { alltopics , error } = await getTopics(token);
      for (const element of alltopics) {
        const currentTopic = await getTopicById(token, element.id);
        console.log("current topic is");
        console.log(currentTopic.topic.title);
      }

      
      if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
      }
  
      return res.status(200).json();
    } catch (error: any) {
      console.error('Unhandled error in getTopicsModel:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }