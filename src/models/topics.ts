
import { Request, Response } from "express";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { Database, Tables } from "../supabase/types/supabase";

function createSupabaseClient(token: string) {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
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
      console.log(token);
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: no token provided" });
      }
  
      const { alltopics , error } = await getTopics(token);
  
      alltopics.forEach(async element => {
        const currentTopic = await getTopicById(token, element.id);
        console.log("current topic is");
        console.log(currentTopic.topic.title);
      });

      
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