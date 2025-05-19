import express from "express";
const router = express.Router();

import { generateCards , cardFreeTextAnswer, cardSelectAnswer } from "../controllers/cardController";

router.post("/generateCards", generateCards);
router.post("/cardFreeTextAnswer", cardFreeTextAnswer);
router.post("/cardSelectAnswer", cardSelectAnswer);


export default router;
