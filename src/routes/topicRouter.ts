import express from "express";
const router = express.Router();

import { getUserTopics, addUserTopic, getSubtopics , addSubtopic} from "../controllers/topicController";

router.get("/", getUserTopics);
router.post("/", addUserTopic);
router.get("/subtopic", getSubtopics);
router.post("/subtopic", addSubtopic);

export default router;
