import { Request, Response } from "express";
import { getSubtopicByTopicId, createNewSubtopic } from "../models/subtopics";
import { getTopicByTitle } from "../models/topics";

export const getSubtopics = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const topicTitle: string = req.query.topic as string;

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

        const { subtopics, error: subTopicError } = await getSubtopicByTopicId(
            token,
            topic.id,
        );

        if (subTopicError) {
            console.error(subTopicError);
            res.status(400).json({ error: subTopicError.message });
        }

        res.status(200).json(subtopics);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const addSubtopic = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const topicTitle: string = req.body.topic;
        const subtopicTitle: string = req.body.title;
        const design: string = req.body.design;
        const colour: string = req.body.color;

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

        const newSubtopic = await createNewSubtopic(
            token,
            subtopicTitle,
            topic.id,
            design,
            colour,
        );

        //TODO - handle errors gracefully.
        // if (subTopicError) {
        //     console.error(subTopicError);
        //     res.status(400).json({ error: subTopicError.message });
        // }

        res.status(200).json(newSubtopic);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
