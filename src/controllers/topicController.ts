import { Request, Response } from "express";
import {
    getUserTopics,
    createUserTopic,
    deleteUserTopicRow,
} from "../models/topics";
import { deleteAllTopicSubtopics } from "../models/subtopics";

export const getTopics = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        //and so forth... (note: if you create a topic with an existing name an error will be returned)
        //const newTopic = await createNewTopic(token, "ninth");

        const { userTopics, error } = await getUserTopics(token);

        if (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }

        res.status(200).json(userTopics);
    } catch (error: any) {
        console.error("Unhandled error in getTopicsModel:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addUserTopic = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Get Auth
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { title, design, colour } = req.body;

        const { data: topicData, error } = await createUserTopic(
            token,
            title,
            design,
            colour,
        );

        if (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }

        res.status(200).json(topicData);
    } catch (error: any) {
        console.error("Unhandled error in addTopicsModel:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUserTopic = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Get Auth
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ error: "Unauthorized: no token provided" });
        }

        const { id } = req.body;

        const { topic, error: topicError } = await deleteUserTopicRow(token, id);

        if (topicError) {
            console.error(topicError);
            res.status(400).json({ error: topicError.message });
        }

        const { subtopics, error: subtopicsError } =
            await deleteAllTopicSubtopics(token, topic.topic_id);

        if (subtopicsError) {
            console.error(subtopicsError);
            res.status(400).json({ error: subtopicsError.message });
        }

        const data = {
            topic,
            subtopics,
        };

        res.status(200).json(data);
    } catch (error: any) {
        console.error("Unhandled error in deleteTopicsModel:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
