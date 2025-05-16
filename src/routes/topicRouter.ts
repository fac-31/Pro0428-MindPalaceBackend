import express from "express";
const router = express.Router();

import { getUserTopics, addUserTopic } from "../controllers/topicController";

router.get("/", getUserTopics);
router.post("/", addUserTopic);

export default router;
