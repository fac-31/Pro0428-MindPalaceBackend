import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ENV_MODE = process.env.ENV_MODE || "development";
let frontendUrl: string;

if (ENV_MODE === "development") {
    console.log("Running in development mode");
    frontendUrl = "http://localhost:3000";
} else if (ENV_MODE === "production") {
    console.log("Running in production mode");
    frontendUrl = "https://mind-palace-fe.vercel.app"; // replace with your production URL
}
app.use(
    cors({
        origin: frontendUrl,
        credentials: true, // if you're sending cookies or Authorization headers
    }),
);

import cardRouter from "./routes/cardRouter";
import topicRouter from "./routes/topicRouter";
import subtopicRouter from "./routes/subtopicRouter";

app.use("/card", cardRouter);
app.use("/topic", topicRouter);
app.use("/subtopic", subtopicRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server connected at http://localhost:${PORT}`);
});
