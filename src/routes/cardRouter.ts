import express from "express";
const router = express.Router();

import { generateCards, helloCard } from "../controllers/cardController";

router.get("/", helloCard);
router.post("/generateCards", generateCards);


export default router;
