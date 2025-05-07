import { Request, Response } from "express";
//import { getTopicsModel } from "../models/topics";

export const getTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Hello from topic controller" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
