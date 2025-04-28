import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import cardRouter from "./routes/cardRouter";

app.use("/card", cardRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server connected at http://localhost:${PORT}`);
});
