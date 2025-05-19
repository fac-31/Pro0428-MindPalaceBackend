import { Request, Response } from "express";
import { generateCardsModel, insertGeneratedCards } from "../models/card";
import { getTopicByTitle } from "../models/topics";
import { getSubtopicByTopicIdAndSubtopicTitle } from "../models/subtopics";

export const generateCards = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const topicTitle: string = req.body.topic;
        const subtopicTitle: string = req.body.subtopic;

        console.log("entered generateCards Controller");
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { data: topic, error: topicError } = await getTopicByTitle(
            token,
            topicTitle,
        );
        console.log("got topic by Title");

        if (topicError) {
            console.error(topicError);
            res.status(400).json({ error: topicError.message });
        }

        const { subtopic, error: subTopicError } =
            await getSubtopicByTopicIdAndSubtopicTitle(
                token,
                topic.id,
                subtopicTitle,
            );
        console.log("got subtopic by Title");

        if (subTopicError) {
            console.error(subTopicError);
            res.status(400).json({ error: subTopicError.message });
        }

        const cards = await generateCardsModel();
        console.log("generated cards");

        insertGeneratedCards(token, cards, topic, subtopic);

        res.status(200).json({ message: cards });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
