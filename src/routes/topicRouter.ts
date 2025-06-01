import express from "express";
const router = express.Router();

import { getTopics, addUserTopic, deleteUserTopic } from "../controllers/topicController";

router.get("/", getTopics);
router.post("/", addUserTopic);
router.delete("/", deleteUserTopic)

export default router;
