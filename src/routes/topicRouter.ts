import express from "express";
const router = express.Router();

import { getTopics, doesTopicExist, addUserTopic, deleteUserTopic } from "../controllers/topicController";

router.get("/", getTopics);
router.get("/exists", doesTopicExist)
router.post("/", addUserTopic);
router.delete("/", deleteUserTopic)

export default router;
