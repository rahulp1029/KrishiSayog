import { GoogleGenerativeAI } from "@google/generative-ai";

// Try with zero instead of O
const API_KEY = "AIzaSyCRFkss5k3YHdiDJKUMRgf07XH-yytSE6Y";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'hello world'");
        console.log("SUCCESS:", result.response.text());
    } catch (error) {
        console.error("FAILED:", error.message || error);
        if (error.status) console.error("Status:", error.status);
    }
}
run();
