import { Request, Response } from "express";
import { generateCardsModel , insertGeneratedCards} from "../models/card";


export const helloCard = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Hello from card controller" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const generateCards = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("entered contoller");
    const cards = await generateCardsModel();
    insertGeneratedCards(req, res, cards);

    res.status(200).json({ message : cards})
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};