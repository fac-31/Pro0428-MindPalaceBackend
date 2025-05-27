import express from "express";
const router = express.Router();

import { generateCards, getCards } from "../controllers/cardController";

router.post("/generateCards", generateCards);
router.get("/getCards", generateCards);

export default router;
