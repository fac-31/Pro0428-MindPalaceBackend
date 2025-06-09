import { Request, Response } from "express";
import { generateCardsModel, 
    insertGeneratedCards, 
    getCardsModel, 
    getAnswers, 
    getMasteryByCardID ,
    updateMastery,
    insertNewMastery, 
recalculateMastery} from "../models/card";
import { getTopicByTitle } from "../models/topics";
import { getSubtopicByTopicIdAndSubtopicTitle } from "../models/subtopics";
import { TablesInsert, Tables } from "../supabase/types/supabase";


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
        const cardsWithAnswers = await insertGeneratedCards(token, cards, topic, subtopic);
        res.status(200).json(cardsWithAnswers);
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
        
        res.status(200).json(cardsWithAnswers);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const recordAnswer = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const isCorrect: boolean = req.body.isCorrect;
        const card_id: string = req.body.card_id;

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { data, error } = await getMasteryByCardID(
            token,
            card_id
        );

        if (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }

        if (data)
        {
            recalculateMastery(data, isCorrect);
            //update existing data
            const { data : updatedData, error } = await updateMastery(
                token, 
                data
            );

            if (error)
            {
                console.error(error);
                res.status(400).json({ error: error.message });
            }

        }
        else
        {
            let newCardMastery: TablesInsert<"mastery"> = {
                    card_id: "", //filled at insertNewMastery below
                    user_id: "", //filled at insertNewMastery below.
                    attempts: 0,
                    correct_attempts:  0,
                    mastery: 0 
                };

            recalculateMastery(newCardMastery, isCorrect);

            const { data , error } = await insertNewMastery(
                token, 
                newCardMastery,
                card_id
            );

            if (error)
            {
                console.error(error);
                res.status(400).json({ error: error.message });
            }

        }

        res.status(200).json();
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

