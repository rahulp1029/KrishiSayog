import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = {
    role: "user" | "bot";
    text: string;
    timestamp: number;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const MODELS_TO_TRY = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash", 
];

const SYSTEM_PROMPT = `You are KrishiBot, an expert AI farming assistant. Answer in the same language as the user. Provide practical farming advice. Always be helpful and polite. Use markdown for better formatting.`;

export async function getAIResponseStream(
    userMessage: string,
    history: ChatMessage[],
    onStream: (text: string) => void
): Promise<string> {
    if (!genAI) {
        console.error("❌ KrishiBot: VITE_GEMINI_API_KEY is missing in your .env file!");
        throw new Error("VITE_GEMINI_API_KEY missing");
    }

    let lastError = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`🤖 KrishiBot: Attempting connection with ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_PROMPT,
            });

            // Gemini strictly requires: First message MUST be 'user', and roles MUST alternate.
            const cleanHistory: { role: string, parts: { text: string }[] }[] = [];
            let expectedRole = "user";

            for (const m of history) {
                const mappedRole = m.role === "user" ? "user" : "model";
                if (mappedRole === expectedRole) {
                    cleanHistory.push({
                        role: mappedRole,
                        parts: [{ text: m.text }]
                    });
                    expectedRole = expectedRole === "user" ? "model" : "user";
                }
            }

            // If the last history item we kept is 'user', and we are about to send ANOTHER 'user' message 
            // via sendMessageStream, Gemini will throw an error since it expects 'user' -> 'model' alternating.
            // In that case, we pop the last 'user' history message so that the upcoming userMessage is the only one.
            if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
                cleanHistory.pop();
            }

            const chat = model.startChat({
                history: cleanHistory
            });

            const result = await chat.sendMessageStream(userMessage);
            let fullText = "";
            
            // If we successfully get the stream, we use this model
            for await (const chunk of result.stream) {
                const text = chunk.text();
                fullText += text;
                onStream(fullText);
            }
            
            console.log(`✅ KrishiBot: Successfully used ${modelName}`);
            return fullText;
        } catch (error) {
            console.warn(`⚠️ KrishiBot: Failed to use ${modelName}:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    console.error("❌ KrishiBot: All models failed to respond.", lastError);
    throw lastError || new Error("Failed to get response from Gemini AI");
}
