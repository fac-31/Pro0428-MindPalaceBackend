import express from "express";
const router = express.Router();

import { getSubtopics, doesSubtopicExist, addSubtopic, deleteSubtopic } from "../controllers/subtopicController";

router.get("/", getSubtopics);
router.get("/exists", doesSubtopicExist)
router.post("/", addSubtopic);
router.delete("/", deleteSubtopic);

export default router;