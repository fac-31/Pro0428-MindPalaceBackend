import { Request, Response } from "express";
import { getTopicsModel, addTopicModel } from "../models/topics";

export const getUserTopics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log("topic controller entered");
    await getTopicsModel(req, res);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addUserTopic = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log("adding user topic");
    await addTopicModel(req, res);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
