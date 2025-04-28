import { Request, Response } from "express";

export const helloCard = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Hello from card controller" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
