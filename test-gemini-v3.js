
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function test() {
    try {
        if (!API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY missing");
        }
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Try gemini-1.5-flash as it is more widely available
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("✅ API Success:", response.text());
        fs.writeFileSync("test-output.txt", "SUCCESS: " + response.text());
    } catch (error) {
        console.error("❌ API Error:", error.message);
        fs.writeFileSync("test-output.txt", "ERROR: " + error.message + "\nSTACK: " + error.stack);
    }
}

test();
