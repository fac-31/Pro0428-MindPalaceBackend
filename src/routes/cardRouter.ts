import express from "express";
const router = express.Router();

import { generateCards, getCards , recordAnswer} from "../controllers/cardController";

router.post("/", generateCards);
router.get("/", getCards);
router.post("/recordAnswer", recordAnswer)
export default router;