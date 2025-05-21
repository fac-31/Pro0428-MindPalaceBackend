import express from "express";
const router = express.Router();

import { getSubtopics, addSubtopic } from "../controllers/subtopicController";

router.get("/", getSubtopics);
router.post("/", addSubtopic);

export default router;