import { Request, Response } from "express";
import { generateCardsModel, insertGeneratedCards, getFreeCardAnswerByCardId, IsUserAnswerSameAsGroundTruth, getSelectCardAnswerByCardId} from "../models/card";
import {
    getTopicByTitle,
    getSubtopicByTopicIdAndSubtopicTitle,
} from "../models/topics";

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


export const cardFreeTextAnswer = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const card_id: string = req.body.card_id;
        const card_free_user_answer: string = req.body.user_answer;

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        //get card from DB
        const { data : answer, error: cardError } = await getFreeCardAnswerByCardId(
            token,
            card_id,
        );

        if (cardError) {
            console.error(cardError);
            res.status(400).json({ error: cardError.message });
        }

        //compare stored answer with user's answer
        const similarityThreshold = 0.7;
        const identical = IsUserAnswerSameAsGroundTruth(card_free_user_answer, answer.correct_answer,  similarityThreshold)

        res.status(200).json(
            { identical,
              correct_answer : answer.correct_answer
             }
        );
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};



export const cardSelectAnswer = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const card_id: string = req.body.card_id;
        const card_select_user_answer: number = req.body.user_answer; // the index of the user's answer

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        //get card from DB
        const { data : answer, error: cardError } = await getSelectCardAnswerByCardId(
            token,
            card_id,
        );

        if (cardError) {
            console.error(cardError);
            res.status(400).json({ error: cardError.message });
        }

        //compare stored answer with user's answer
        const identical = (card_select_user_answer == answer.correct_index);

        res.status(200).json(
            { identical,
              correct_index : answer.correct_index
             }
        );
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
