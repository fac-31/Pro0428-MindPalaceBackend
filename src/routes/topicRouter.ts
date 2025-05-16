import express from "express";
const router = express.Router();

import { getUserTopics, addUserTopic, getSubtopics } from "../controllers/topicController";

router.get("/", getUserTopics);
router.post("/", addUserTopic);
router.post("/subtopic", getSubtopics);

export default router;
