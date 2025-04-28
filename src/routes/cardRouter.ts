import express from "express";
const router = express.Router();

import { helloCard } from "../controllers/cardController";

router.get("/", helloCard);

export default router;
