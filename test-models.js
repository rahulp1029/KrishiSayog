
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function test() {
    try {
        if (!API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY missing");
        }
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            fs.writeFileSync("test-output.txt", "ERROR: " + JSON.stringify(data, null, 2));
        } else {
            fs.writeFileSync("test-output.txt", "MODELS: " + JSON.stringify(data, null, 2));
        }
    } catch (error) {
        fs.writeFileSync("test-output.txt", "FATAL: " + error.message);
    }
}

test();
