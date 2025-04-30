import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

if (!process.env.OPENAI_KEY) {
	throw new Error("OPENAI_KEY is not set in the .env file");
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

export default openai;
