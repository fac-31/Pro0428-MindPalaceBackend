import express from "express";
const router = express.Router();

import { getTopics, addUserTopic } from "../controllers/topicController";

router.get("/", getTopics);
router.post("/", addUserTopic);

export default router;
