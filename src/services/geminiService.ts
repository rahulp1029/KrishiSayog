import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = {
    role: "user" | "bot";
    text: string;
    timestamp: number;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Supported Gemini API model hierarchy
const MODELS_TO_TRY = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest"
];

const SYSTEM_PROMPT = `You are KrishiBot, an expert AI farming assistant for Indian agriculture. 
Answer in the same language as the user (English, Hindi, Kannada, Marathi, etc.). 
Provide practical, easy-to-follow advice for crops, soil health, pest control, weather, and government schemes. 
Always be polite, encouraging, and clear. Use markdown with emojis for formatting.`;

// Local fallback agricultural knowledge base for offline/network resilience
const LOCAL_AGRI_RESPONSES: Record<string, string> = {
    "alugadde": "🥔 **Potato (ಅಲೂಗಡ್ಡೆ / Potato) Farming Guide**:\n- **Best Soil**: Well-drained sandy loam rich in organic matter (pH 5.2 - 6.4).\n- **Planting Season**: Oct-Nov (Rabi season in South India).\n- **Common Pests**: Potato tuber moth & aphid vectors.\n- **Disease Prevention**: Protect against Early & Late Blight using certified seed tubers and copper fungicide sprays.",
    "potato": "🥔 **Potato Farming Guide**:\n- **Best Soil**: Well-drained sandy loam soil rich in organic matter.\n- **Sowing**: October to November in plains.\n- **Disease Care**: Guard against Late Blight with proper field drainage and fungicide application.",
    "tomato": "🍅 **Tomato Cultivation Tips**:\n- **Soil**: Deep, well-drained loam soil.\n- **Key Disease**: Early & Late Blight. Prune lower leaves to avoid soil splash.",
    "rice": "🌾 **Rice / Paddy Farming**:\n- Needs high water retention soil. Protect against Stem Borer and Blast disease using bio-control agents.",
    "wheat": "🌾 **Wheat Crop Advice**:\n- Requires cool climate during growth and warm during ripening. Monitor for Rust infections."
};

function getLocalFallbackResponse(userMessage: string): string {
    const msgLower = userMessage.toLowerCase().trim();
    for (const [key, advice] of Object.entries(LOCAL_AGRI_RESPONSES)) {
        if (msgLower.includes(key)) {
            return advice;
        }
    }
    return `🌱 **KrishiBot Advice**:\nThank you for asking about **"${userMessage}"**.\n\nFor optimal crop growth, ensure proper soil testing, balanced N-P-K fertilization, timely irrigation, and regular monitoring for pests. You can also scan leaf photos in the **Disease Detection** section for instant diagnosis!`;
}

export async function getAIResponseStream(
    userMessage: string,
    history: ChatMessage[],
    onStream: (text: string) => void
): Promise<string> {
    if (!genAI) {
        console.warn("⚠️ KrishiBot: VITE_GEMINI_API_KEY is not set. Using local agricultural AI.");
        const fallback = getLocalFallbackResponse(userMessage);
        onStream(fallback);
        return fallback;
    }

    let lastError = null;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`🤖 KrishiBot: Connecting with ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_PROMPT,
            });

            // Clean conversation history for Gemini API alternating user/model pattern
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

            if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
                cleanHistory.pop();
            }

            const chat = model.startChat({
                history: cleanHistory
            });

            const result = await chat.sendMessageStream(userMessage);
            let fullText = "";
            
            for await (const chunk of result.stream) {
                const text = chunk.text();
                fullText += text;
                onStream(fullText);
            }
            
            console.log(`✅ KrishiBot: Response received from ${modelName}`);
            return fullText;
        } catch (error: any) {
            console.warn(`⚠️ KrishiBot: ${modelName} attempt failed:`, error?.message || error);
            lastError = error;
        }
    }

    console.warn("⚠️ KrishiBot: All API models failed. Using local fallback assistant.");
    const fallbackResponse = getLocalFallbackResponse(userMessage);
    onStream(fallbackResponse);
    return fallbackResponse;
}
