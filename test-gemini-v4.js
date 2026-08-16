
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
        
        // List models
        // Note: The SDK might not have a direct listModels but we can fetch it via fetch or any other method if needed
        // But let's try a different approach: try 'gemini-pro' which is the older name
        
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        let success = false;
        let results = "";

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                results += `✅ ${modelName}: ${response.text().substring(0, 20)}...\n`;
                success = true;
            } catch (e) {
                results += `❌ ${modelName}: ${e.message}\n`;
            }
        }

        fs.writeFileSync("test-output.txt", results);
        console.log("Results written to test-output.txt");
    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
        fs.writeFileSync("test-output.txt", "FATAL: " + error.message);
    }
}

test();
