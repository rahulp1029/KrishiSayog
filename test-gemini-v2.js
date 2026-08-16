
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function test() {
    if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY missing");
        return;
    }
    console.log("Testing with API Key:", API_KEY.substring(0, 10) + "...");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent("Hello");
        console.log("Response:", result.response.text());
        console.log("✅ API Key is working!");
    } catch (error) {
        console.error("❌ API Error:", error.message);
    }
}

test();
