import express from "express";
const router = express.Router();

import { generateCards } from "../controllers/cardController";

router.post("/generateCards", generateCards);

export default router;
