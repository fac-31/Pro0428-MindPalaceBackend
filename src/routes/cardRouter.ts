import express from "express";
const router = express.Router();

import { generateCards, getCards } from "../controllers/cardController";

router.post("/", generateCards);
router.get("/", getCards);

export default router;
