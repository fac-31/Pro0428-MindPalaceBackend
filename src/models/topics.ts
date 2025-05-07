
import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://wkstbehsenrlwhtaqfgq.supabase.co'
export async function getTopicsModel(req: Request, res: Response) {
  
    try {
      const token = req.headers.authorization?.split(' ')[1];
      console.log(token);
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: no token provided" });
      }
  
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
  
      const { data, error } = await supabase.from('topics').select('*');
  
      if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
      }
  
      console.log(data);
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Unhandled error in getTopicsModel:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }