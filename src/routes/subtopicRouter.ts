import express from "express";
const router = express.Router();

import { getSubtopics, addSubtopic, deleteSubtopic } from "../controllers/subtopicController";

router.get("/", getSubtopics);
router.post("/", addSubtopic);
router.delete("/", deleteSubtopic)

export default router;