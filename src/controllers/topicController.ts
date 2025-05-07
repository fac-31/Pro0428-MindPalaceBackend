import { Request, Response } from "express";
import { getTopicsModel } from "../models/topics";

export const getTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("topic controller entered");
    await getTopicsModel(req, res);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
