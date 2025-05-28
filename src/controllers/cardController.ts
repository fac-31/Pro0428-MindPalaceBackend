import { Request, Response } from "express";
import { generateCardsModel, insertGeneratedCards, getCardsModel, getAnswers } from "../models/card";
import { getTopicByTitle } from "../models/topics";
import { getSubtopicByTopicIdAndSubtopicTitle } from "../models/subtopics";

export const generateCards = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const topicTitle: string = decodeURIComponent(req.body.topic);
        const subtopicTitle: string = decodeURIComponent(req.body.subtopic);

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { data: topic, error: topicError } = await getTopicByTitle(
            token,
            topicTitle,
        );

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

        if (subTopicError) {
            console.error(subTopicError);
            res.status(400).json({ error: subTopicError.message });
        }

        const cards = await generateCardsModel(topic.title, subtopic.title);
        insertGeneratedCards(token, cards, topic, subtopic);

        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const getCards = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const topicTitle: string = decodeURIComponent(req.query.topic as string);
        const subtopicTitle: string = decodeURIComponent(req.query.subtopic as string);

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { data: topic, error: topicError } = await getTopicByTitle(
            token,
            topicTitle,
        );

        if (topicError) {
            console.error(topicError);
            res.status(400).json({ error: topicError.message });
        }

        const cards = await getCardsModel(token, topic.id, subtopicTitle);
        const cardsWithAnswers = await getAnswers(token, cards);
        
        console.log("answers");
        console.log(cardsWithAnswers);
        res.status(200).json(cardsWithAnswers);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
