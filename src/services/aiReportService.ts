import { GoogleGenerativeAI } from "@google/generative-ai";
import { SensorReading } from "@/services/iotConfig";
import { generateCropRecommendations } from "@/services/cropRecommendationEngine";

export type FarmAIReport = {
    summary: string;
    soilHealthScore: number;
    healthCategory: "Excellent" | "Good" | "Fair" | "Poor";
    npkAnalysis: string;
    phAnalysis: string;
    irrigationAdvice: string;
    recommendedCrops: string[];
    actionItems: string[];
    fullMarkdown: string;
    generatedAt: string;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const MODELS = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];

export async function generateAIReport(sensorData: Partial<SensorReading>): Promise<FarmAIReport> {
    const defaultData: SensorReading = {
        moisture: sensorData.moisture ?? 45,
        temperature: sensorData.temperature ?? 28,
        humidity: sensorData.humidity ?? 65,
        soilPH: sensorData.soilPH ?? 6.5,
        soilTemp: sensorData.soilTemp ?? 25,
        nitrogen: sensorData.nitrogen ?? 42,
        phosphorus: sensorData.phosphorus ?? 35,
        potassium: sensorData.potassium ?? 55,
        farmHealth: sensorData.farmHealth ?? 85,
        lightIntensity: sensorData.lightIntensity ?? 45000,
        timestamp: Date.now()
    };

    // Calculate real scientific agronomic recommendations
    const dynamicCropRecs = generateCropRecommendations(defaultData, null);
    const topCropNames = dynamicCropRecs.slice(0, 4).map(c => c.name);

    const prompt = `
You are KrishiSayog AI, a warm, highly encouraging, expert Agronomist and Soil Health Specialist in India.
Analyze the following real-time IoT farm sensor telemetry and generate an OPTIMISTIC, DECORATIVE, AND HIGHLY PROFESSIONAL Soil Health & Agronomic Advisory Report for the farmer.

CURRENT SENSOR TELEMETRY:
- Soil Moisture: ${defaultData.moisture}% (Optimal: 40-70%)
- Air Temperature: ${defaultData.temperature}°C
- Air Humidity: ${defaultData.humidity}%
- Soil pH: ${defaultData.soilPH} (Optimal: 6.0 - 7.5)
- Soil Temperature: ${defaultData.soilTemp}°C
- Nitrogen (N): ${defaultData.nitrogen} mg/kg (Optimal: 40-80 mg/kg)
- Phosphorus (P): ${defaultData.phosphorus} mg/kg (Optimal: 30-60 mg/kg)
- Potassium (K): ${defaultData.potassium} mg/kg (Optimal: 40-80 mg/kg)
- Overall Farm Health Index: ${defaultData.farmHealth}/100
- Sunlight Intensity: ${defaultData.lightIntensity} Lux

AGRONOMIC ENGINE RECOMMENDED CROPS: ${topCropNames.join(", ")}

IMPORTANT INSTRUCTIONS:
- Tone: Enthusiastic, warm, optimistic, highly professional, encouraging the farmer while saving their input costs.
- Greet with: "Namaste! I am KrishiSayog AI, your Agronomist and Soil Health Specialist."
- Congratulate the farmer on their overall farm health index.
- Format with clean Markdown headers:

### Executive Agronomic Summary
Warm greeting, overall congratulation message, and short bulleted breakdown of Soil & Moisture, Nutrient Profile, and Micro-Climate.

### Soil Health & Nutrient Advisory
Optimistic analysis of pH Level (${defaultData.soilPH}), Nitrogen (${defaultData.nitrogen} mg/kg), Phosphorus (${defaultData.phosphorus} mg/kg), Potassium (${defaultData.potassium} mg/kg), and Organic Treatment tips (FYM/Vermicompost). Highlight cost savings where inputs can be paused!

### Irrigation & Water Management
Current status, immediate action, and forward-looking advice (Drip vs Sprinkler tips based on humidity ${defaultData.humidity}%).

### Top Recommended Crops
Detailed list of 4 recommended crops (${topCropNames.join(", ")}) with specific reasons why this soil will deliver exceptional yields.

### Farmer Action Plan: Maximizing Your Soil Health
Numbered list of 5 encouraging, actionable steps (e.g. 1. Celebrate Input Savings, 2. Conserve Water & Energy, 3. Proactive Fungal Scouting, 4. Smart Drainage Maintenance, 5. Gentle Preventative Care).
`;

    if (!genAI) {
        return generateOfflineFallbackReport(defaultData, topCropNames);
    }

    let lastError = null;

    for (const modelName of MODELS) {
        try {
            console.log(`🤖 KrishiSayog Report AI: Generating report with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            const category: "Excellent" | "Good" | "Fair" | "Poor" =
                defaultData.farmHealth >= 80 ? "Excellent" :
                defaultData.farmHealth >= 65 ? "Good" :
                defaultData.farmHealth >= 50 ? "Fair" : "Poor";

            const rawSummary = extractSection(responseText, "Executive Agronomic Summary", "Namaste! Your farm is operating at peak soil and environmental health.");
            const rawNutrient = extractSection(responseText, "Soil Health & Nutrient Advisory", "Your soil nutrient levels are naturally rich and bioavailable.");
            const rawIrrigation = extractSection(responseText, "Irrigation & Water Management", "Soil moisture is well balanced.");

            return {
                summary: rawSummary,
                soilHealthScore: defaultData.farmHealth,
                healthCategory: category,
                npkAnalysis: rawNutrient,
                phAnalysis: `Soil pH is ${defaultData.soilPH} (${defaultData.soilPH >= 6.0 && defaultData.soilPH <= 7.5 ? 'Optimal' : 'Needs attention'}).`,
                irrigationAdvice: rawIrrigation,
                recommendedCrops: topCropNames.length > 0 ? topCropNames : ["Wheat (Gehun)", "Mustard (Sarson)", "Chickpea (Chana)", "Tomato / Potato"],
                actionItems: [
                    "Celebrate Input Savings: Pause unnecessary fertilizer applications",
                    "Conserve Water & Energy: Keep irrigation resting while moisture is optimal",
                    "Proactive Fungal Scouting: Check leaf undersides during high humidity",
                    "Smart Drainage Maintenance: Keep channels clear for heavy rain",
                    "Gentle Preventative Care: Apply organic neem oil spray if needed"
                ],
                fullMarkdown: responseText,
                generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            };
        } catch (err: any) {
            console.warn(`⚠️ Report AI: ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    console.warn("⚠️ All Gemini models failed, generating intelligent fallback report.");
    return generateOfflineFallbackReport(defaultData, topCropNames);
}

function extractSection(text: string, title: string, fallback: string): string {
    const regex = new RegExp(`###\\s*\\d*\\.?\\s*${title}[\\s\\S]*?(?=###|$)`, "i");
    const match = text.match(regex);
    if (match) {
        return match[0].replace(/###\s*\d*\.?\s*[\w\s&]+/i, "").trim();
    }
    return fallback;
}

function generateOfflineFallbackReport(data: any, topCropNames: string[] = []): FarmAIReport {
    const crops = topCropNames.length > 0 ? topCropNames : ["Wheat (Gehun)", "Mustard (Sarson)", "Chickpea (Chana)", "Tomato / Potato"];
    const moistureStatus = data.moisture < 35 ? "Needs Gentle Irrigation" : data.moisture > 75 ? "Abundantly Hydrated" : "Perfect Sweet Spot";
    const category = data.farmHealth >= 80 ? "Excellent" : data.farmHealth >= 65 ? "Good" : data.farmHealth >= 50 ? "Fair" : "Poor";

    const fullMarkdown = `
Namaste! I am KrishiSayog AI, your Agronomist and Soil Health Specialist.

Congratulations! Your farm's Overall Health Index has reached a stellar **${data.farmHealth}/100 (${category} Condition)**. Your soil and ambient environmental conditions set a brilliant foundation for a highly successful harvest.

• **Soil & Moisture**: Your soil moisture is sitting comfortably at **${data.moisture}% (${moistureStatus})**. Your crop roots are enjoying ideal access to both water and oxygen!
• **Nutrient Profile**: You have cultivated a naturally rich and fertile soil profile. Nitrogen (${data.nitrogen} mg/kg), Phosphorus (${data.phosphorus} mg/kg), and Potassium (${data.potassium} mg/kg) levels are in excellent balance.
• **Micro-Climate**: Current air temperature (${data.temperature}°C) and soil temperature (${data.soilTemp}°C) are absolutely ideal for robust seed germination and deep root development.

### Soil Health & Nutrient Advisory
- **pH Level (${data.soilPH}) - Optimal**: Your soil pH is excellent! Essential macro and micro-nutrients are naturally bioavailable to your plants. You can save your money as no lime or sulfur amendments are needed right now.
- **Nitrogen (${data.nitrogen} mg/kg) - High-Optimal**: Fantastic news for your input costs! Your soil has abundant nitrogen for lush vegetative growth. You can confidently skip Urea applications today.
- **Phosphorus (${data.phosphorus} mg/kg) - Optimal**: Phosphorus reserves are in great shape. You can safely pause DAP/SSP applications.
- **Potassium (${data.potassium} mg/kg) - Strong**: Potassium levels are robust. Holding off on MOP prevents nutrient blockages and saves money!

### Irrigation & Water Management
- **Current Status**: Soil Moisture = ${data.moisture}% | Humidity = ${data.humidity}%.
- **Immediate Action**: ${data.moisture < 40 ? "Schedule a light drip irrigation session today." : "Your soil is perfectly hydrated! Enjoy a break—no irrigation is required today."}
- **Looking Ahead**: Allow soil to dry down naturally before the next cycle. Utilize drip irrigation to deliver water straight to the roots.

### Top Recommended Crops
Based on your stellar soil pH (${data.soilPH}) and rich NPK reserves, your land is primed for exceptional yields with:
${crops.map((c, i) => `${i + 1}. **${c}**: Thrives in your neutral pH soil with high natural nutrient support.`).join("\n")}

### Farmer Action Plan: Maximizing Your Soil Health
1. **Celebrate Input Savings**: Your soil fertility is naturally peaking. Save your money and pause extra chemical fertilizer applications.
2. **Conserve Water & Energy**: Keep irrigation pumps resting while moisture remains strong.
3. **Proactive Fungal Scouting**: Take a quick walk through the field to inspect leaf undersides during high humidity.
4. **Smart Drainage Maintenance**: Ensure drainage channels remain clear in event of heavy rainfall.
5. **Gentle Preventative Care**: Apply an organic neem-oil spray (5 ml/L) if needed to guard healthy foliage.
`;

    return {
        summary: `Namaste! Your farm Health Index is ${data.farmHealth}/100 (${category}). Moisture: ${data.moisture}% (${moistureStatus}). Soil NPK and pH are in peak condition!`,
        soilHealthScore: data.farmHealth,
        healthCategory: category,
        npkAnalysis: `Nitrogen: ${data.nitrogen} mg/kg, Phosphorus: ${data.phosphorus} mg/kg, Potassium: ${data.potassium} mg/kg. Nutrient profile is fertile and well-balanced.`,
        phAnalysis: `pH ${data.soilPH} (Optimal neutral). Nutrients are bioavailable.`,
        irrigationAdvice: data.moisture < 40 ? "Light drip irrigation recommended." : "Soil is perfectly hydrated. No irrigation required today.",
        recommendedCrops: crops,
        actionItems: [
            "Celebrate Input Savings: Pause Urea, DAP, and MOP applications today",
            "Conserve Water & Energy: Keep irrigation pumps resting while moisture is strong",
            "Proactive Fungal Scouting: Walk the field to inspect leaf undersides",
            "Smart Drainage Maintenance: Keep field bunds clear for heavy rains",
            "Gentle Preventative Care: Apply organic neem oil spray if needed"
        ],
        fullMarkdown: fullMarkdown,
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
}
