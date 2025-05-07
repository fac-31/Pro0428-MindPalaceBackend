import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from 'cors';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true // if you're sending cookies or Authorization headers
}));


import cardRouter from "./routes/cardRouter";
import topicRouter from "./routes/topicRouter";

app.use("/card", cardRouter);
app.use("/topic", topicRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server connected at http://localhost:${PORT}`);
});
