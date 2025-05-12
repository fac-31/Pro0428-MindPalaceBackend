import express from "express";
const router = express.Router();

import { getUserTopics } from "../controllers/topicController";

router.get("/", getUserTopics);


export default router;