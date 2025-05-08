import express from "express";
const router = express.Router();

import { getTopics } from "../controllers/topicController";

router.get("/", getTopics);


export default router;