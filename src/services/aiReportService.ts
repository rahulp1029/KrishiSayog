import { GoogleGenerativeAI } from "@google/generative-ai";
import { SensorReading } from "@/services/iotConfig";
import { WeatherData } from "@/types/weather";
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
    language: string;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Hierarchy of supported Gemini model versions (valid names only)
const MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro"
];

export const SUPPORTED_LANGUAGES = [
    { label: "English", value: "English", code: "en-IN" },
    { label: "हिंदी (Hindi)", value: "Hindi", code: "hi-IN" },
    { label: "मराठी (Marathi)", value: "Marathi", code: "mr-IN" },
    { label: "ಕನ್ನಡ (Kannada)", value: "Kannada", code: "kn-IN" },
    { label: "ਪੰਜਾਬੀ (Punjabi)", value: "Punjabi", code: "pa-IN" },
    { label: "తెలుగు (Telugu)", value: "Telugu", code: "te-IN" },
    { label: "தமிழ் (Tamil)", value: "Tamil", code: "ta-IN" },
    { label: "ગુજરાતી (Gujarati)", value: "Gujarati", code: "gu-IN" },
    { label: "বাংলা (Bengali)", value: "Bengali", code: "bn-IN" }
];

export async function generateAIReport(
    sensorData: Partial<SensorReading>,
    language: string = "English",
    weatherData?: WeatherData | null
): Promise<FarmAIReport> {
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

    const dynamicCropRecs = generateCropRecommendations(defaultData, weatherData || null);
    const topCropNames = dynamicCropRecs.slice(0, 4).map(c => c.name);

    let weatherContextPrompt = "LIVE WEATHER DATA (Open-Meteo Forecast):\n- Status: Live Weather Unavailable\n";

    if (weatherData && weatherData.daily && weatherData.daily.date) {
        const d = weatherData.daily;
        const tomorrowIndex = 1;
        const tomorrowDate = d.date[tomorrowIndex] || "Tomorrow";
        const tomorrowRainProb = d.precipitationProbabilityMax?.[tomorrowIndex] ?? 0;
        const tomorrowRainSum = d.precipitationSum?.[tomorrowIndex] ?? 0;
        const tomorrowTempMax = d.temperatureMax?.[tomorrowIndex] ?? 0;
        const tomorrowTempMin = d.temperatureMin?.[tomorrowIndex] ?? 0;
        const tomorrowDesc = d.description?.[tomorrowIndex] || "Clear / Mild";

        const weeklySummary = (d.date || []).map((dt, idx) => 
            `Day ${idx} (${dt}): Rain Prob=${d.precipitationProbabilityMax?.[idx] ?? 0}%, Rain Sum=${d.precipitationSum?.[idx] ?? 0}mm, Temp=${d.temperatureMin?.[idx] ?? 0}°C-${d.temperatureMax?.[idx] ?? 0}°C, Wind=${d.windSpeedMax?.[idx] || 0}km/h, Condition=${d.description?.[idx] || 'Clear'}`
        ).join("\n");

        weatherContextPrompt = `
LIVE WEATHER DATA (Open-Meteo Forecast Source of Truth):
Location: ${weatherData.locationName || weatherData.location || "Nashik, Maharashtra"} (Lat: ${weatherData.latitude}, Lon: ${weatherData.longitude})
Timezone: ${weatherData.timezone}
Fetched At: ${weatherData.fetchedAt}

TOMORROW'S FORECAST:
- Date: ${tomorrowDate}
- Rain Probability: ${tomorrowRainProb}%
- Expected Precipitation: ${tomorrowRainSum} mm
- Max Temp: ${tomorrowTempMax}°C | Min Temp: ${tomorrowTempMin}°C
- Condition: ${tomorrowDesc}

FULL 7-DAY FORECAST SUMMARY:
${weeklySummary}
`;
    }

    const prompt = `
You are KrishiSayog AI — India's most trusted Expert Agronomist, Soil Scientist, and Farm Advisory Specialist.
Analyze the real-time IoT sensor telemetry and live weather forecast below, and generate a COMPREHENSIVE, HIGHLY DETAILED, and PROFESSIONAL Soil Health & Agronomic Advisory Report.

LANGUAGE MANDATE: Write the ENTIRE response in ${language}. Every heading, sentence, bullet point, explanation, and recommendation must be in ${language} only.

${weatherContextPrompt}

LIVE SENSOR TELEMETRY FROM FARM:
- Soil Moisture: ${defaultData.moisture}% (Optimal range: 40–70%)
- Air Temperature: ${defaultData.temperature}°C
- Air Humidity: ${defaultData.humidity}%
- Soil pH: ${defaultData.soilPH} (Optimal: 6.0–7.5 for most crops)
- Soil Temperature: ${defaultData.soilTemp}°C
- Nitrogen (N): ${defaultData.nitrogen} mg/kg (Optimal: 40–80 mg/kg)
- Phosphorus (P): ${defaultData.phosphorus} mg/kg (Optimal: 30–60 mg/kg)
- Potassium (K): ${defaultData.potassium} mg/kg (Optimal: 40–80 mg/kg)
- Overall Farm Health Index: ${defaultData.farmHealth}/100
- Sunlight Intensity: ${defaultData.lightIntensity} Lux

AI CROP ENGINE RECOMMENDED CROPS: ${topCropNames.join(", ")}

STRICT RULES:
1. Use ONLY the weather data above for all numerical weather facts. Never invent rain percentages.
2. For every recommendation, explain WHY in 2–3 sentences (the science behind it).
3. For every nutrient, explain what happens to the crop if it's low/high and what to apply.
4. Be warm, encouraging, and use farmer-friendly language.
5. Each section must have at least 150 words of detailed content.

Generate a detailed report with these EXACT sections in ${language}:

### Executive Agronomic Summary
Write a warm greeting, congratulate the farmer, and provide a full overview of:
- Overall farm health status and what it means for the farmer
- Key highlights from soil moisture, temperature, and humidity readings
- Brief weather outlook and how it affects farming decisions today
- 3-4 bullet points summarizing the most critical observations

### Soil Health & Nutrient Analysis
Provide a thorough scientific analysis of:
- **pH Analysis**: Current pH is ${defaultData.soilPH}. Explain if this is optimal, what crops thrive at this pH, what happens below 6.0 or above 7.5, and whether lime or sulfur is needed.
- **Nitrogen (N) Analysis**: Current N = ${defaultData.nitrogen} mg/kg. Explain nitrogen's role in crop growth (leaf development, chlorophyll), whether current levels are deficient/optimal/excess, and specific fertilizer recommendations (Urea quantity per acre, timing).
- **Phosphorus (P) Analysis**: Current P = ${defaultData.phosphorus} mg/kg. Explain phosphorus's role (root development, flowering, fruiting), current status, and DAP/SSP application advice with quantities.
- **Potassium (K) Analysis**: Current K = ${defaultData.potassium} mg/kg. Explain potassium's role (disease resistance, water regulation, grain quality), current status, and MOP/SOP application advice.
- **Organic Matter Recommendation**: Based on the NPK profile, recommend specific organic treatments (vermicompost, FYM, green manure) with quantities and application method.

### Irrigation & Water Management Plan
Provide a detailed irrigation plan covering:
- Current soil moisture status (${defaultData.moisture}%) — is the crop water-stressed, well-watered, or over-watered?
- Exact interpretation: at this moisture level, what is happening to the crop roots?
- Immediate irrigation decision for today — should the farmer irrigate or not, and why?
- Tomorrow's forecast impact — if rain is coming, how does it change the irrigation schedule?
- Weekly water management schedule based on the 7-day forecast
- Water conservation tips specific to current moisture and weather conditions
- Warning signs of over-irrigation and under-irrigation to watch for

### Top Recommended Crops & Planting Guide
For EACH of the 4 recommended crops (${topCropNames.join(", ")}), provide:
- Why this crop is ideal for the CURRENT soil pH, NPK, moisture, and temperature readings (scientific reasons)
- Expected yield per acre under these conditions
- Optimal sowing date range for the current season
- Key care instructions: irrigation frequency, fertilizer schedule, common pests to watch
- Estimated profit potential

### Pest & Disease Risk Assessment
Based on current temperature (${defaultData.temperature}°C) and humidity (${defaultData.humidity}%):
- Identify 3 most likely pest/disease threats for the recommended crops
- Explain why these conditions favor each pest/disease
- Provide specific preventive measures with product names and application rates
- Organic alternatives for each chemical recommendation

### Farmer Action Plan: 7 Steps for Maximum Yield
Provide 7 numbered, specific, actionable steps the farmer should take in the NEXT 7 DAYS:
- Each step must include WHAT to do, WHEN to do it, HOW to do it, and WHY it matters
- Include specific product names, quantities, and costs where relevant
- Steps should be in priority order
`;


    if (!genAI) {
        return generateOfflineFallbackReport(defaultData, topCropNames, language, weatherData);
    }

    let lastError = null;

    for (const modelName of MODELS) {
        try {
            console.log(`🤖 KrishiSayog Report AI: Generating report in ${language} with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            const category: "Excellent" | "Good" | "Fair" | "Poor" =
                defaultData.farmHealth >= 80 ? "Excellent" :
                defaultData.farmHealth >= 65 ? "Good" :
                defaultData.farmHealth >= 50 ? "Fair" : "Poor";

            const rawSummary = extractSection(responseText, "Executive Agronomic Summary", responseText.slice(0, 300));
            const rawNutrient = extractSection(responseText, "Soil Health & Nutrient Advisory", "Soil nutrient levels are rich and balanced.");
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
                    "Conserve Water & Energy: Check rain forecast before irrigating",
                    "Proactive Fungal Scouting: Check leaf undersides during high humidity",
                    "Smart Drainage Maintenance: Keep channels clear for heavy rain",
                    "Gentle Preventative Care: Apply organic neem oil spray if needed"
                ],
                fullMarkdown: responseText,
                generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                language
            };
        } catch (err: any) {
            console.warn(`⚠️ Report AI: ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    console.warn("⚠️ All Gemini models failed, generating intelligent fallback report.");
    return generateOfflineFallbackReport(defaultData, topCropNames, language, weatherData);
}

export async function answerReportQuestionStream(
    userQuestion: string,
    reportContext: FarmAIReport,
    sensorData: Partial<SensorReading>,
    language: string,
    chatHistory: { role: "user" | "bot"; text: string }[],
    onStream: (chunk: string) => void,
    weatherData?: WeatherData | null
): Promise<string> {
    let weatherFactsPrompt = "LIVE WEATHER DATA (Open-Meteo Forecast): Unavailable";
    
    if (weatherData && weatherData.daily && weatherData.daily.date) {
        const d = weatherData.daily;
        const tomProb = d.precipitationProbabilityMax?.[1] ?? 0;
        const tomSum = d.precipitationSum?.[1] ?? 0;
        const tomDesc = d.description?.[1] || "Clear";
        const tomMax = d.temperatureMax?.[1] ?? 0;
        const tomMin = d.temperatureMin?.[1] ?? 0;

        const weeklyBreakdown = d.date.map((dt, i) => 
            `- ${dt} (${getDayName(dt, i)}): Rain Chance = ${d.precipitationProbabilityMax?.[i] ?? 0}%, Expected Rain = ${d.precipitationSum?.[i] ?? 0}mm, Temp = ${d.temperatureMin?.[i]}°C to ${d.temperatureMax?.[i]}°C, Weather = ${d.description?.[i] || 'Clear'}`
        ).join("\n");

        weatherFactsPrompt = `
LIVE WEATHER DATA (Open-Meteo API Source of Truth):
- Location: ${weatherData.locationName || weatherData.location || "Nashik, Maharashtra"}

TOMORROW'S WEATHER FACT:
- Rain Probability: ${tomProb}%
- Expected Precipitation: ${tomSum} mm
- Weather Condition: ${tomDesc}
- Temperature: ${tomMin}°C (Min) to ${tomMax}°C (Max)

7-DAY WEATHER FORECAST:
${weeklyBreakdown}
`;
    }

    const systemPrompt = `You are KrishiSayog AI, an expert Agronomist and interactive assistant embedded directly inside the farmer's Soil Health Advisory Report.
Answer the farmer's question in ${language}.

${weatherFactsPrompt}

LIVE FARM SENSOR TELEMETRY:
- Soil Moisture: ${sensorData.moisture ?? 45}%
- Soil pH: ${sensorData.soilPH ?? 6.5}
- Nitrogen (N): ${sensorData.nitrogen ?? 42} mg/kg
- Phosphorus (P): ${sensorData.phosphorus ?? 35} mg/kg
- Potassium (K): ${sensorData.potassium ?? 55} mg/kg
- Temperature: ${sensorData.temperature ?? 28}°C
- Air Humidity: ${sensorData.humidity ?? 65}%
- Overall Health Score: ${sensorData.farmHealth ?? 85}/100

ACTIVE REPORT SUMMARY:
${reportContext.summary}

IMPORTANT RESPONSE RULES:
1. For ANY question about weather ("Will it rain tomorrow?", "Will it rain this week?", "Temperature tomorrow?", "Is heavy rain expected?"), answer strictly using the FACTUAL numbers from Open-Meteo supplied above.
2. NEVER invent precipitation percentages or rain values.
3. Clearly distinguish FACT (from Open-Meteo) from RECOMMENDATION (AI agricultural advice).
4. Be warm, encouraging, polite, and clear.`;

    if (!genAI) {
        const fallback = generateSmartQueryFallback(userQuestion, reportContext, sensorData, language, weatherData);
        onStream(fallback);
        return fallback;
    }

    for (const modelName of MODELS) {
        try {
            console.log(`🤖 Report Chatbot: Querying ${modelName} in ${language}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            });

            const formattedHistory = chatHistory.map(h => ({
                role: h.role === "user" ? "user" : "model",
                parts: [{ text: h.text }]
            }));

            const cleanHistory: { role: string; parts: { text: string }[] }[] = [];
            let expected = "user";
            for (const h of formattedHistory) {
                if (h.role === expected) {
                    cleanHistory.push(h);
                    expected = expected === "user" ? "model" : "user";
                }
            }
            if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
                cleanHistory.pop();
            }

            const chat = model.startChat({ history: cleanHistory });
            const resultStream = await chat.sendMessageStream(userQuestion);

            let fullText = "";
            for await (const chunk of resultStream.stream) {
                const text = chunk.text();
                fullText += text;
                onStream(fullText);
            }
            return fullText;
        } catch (err: any) {
            console.warn(`⚠️ Report Chatbot (${modelName}) failed:`, err.message);
        }
    }

    const fallbackText = generateSmartQueryFallback(userQuestion, reportContext, sensorData, language, weatherData);
    onStream(fallbackText);
    return fallbackText;
}

// Smart Intent-Aware Local Fallback
function generateSmartQueryFallback(
    q: string,
    report: FarmAIReport,
    sensor: Partial<SensorReading>,
    language: string,
    weatherData?: WeatherData | null
): string {
    const qLower = q.toLowerCase().trim();
    const tomRain = weatherData?.daily?.precipitationProbabilityMax?.[1] ?? 0;
    const tomSum = weatherData?.daily?.precipitationSum?.[1] ?? 0;

    const isHindiRequest = qLower.includes("hindi") || qLower.includes("हिंदी") || qLower.includes("हिन्दी");
    const isReportQuery = qLower.includes("report") || qLower.includes("summary") || qLower.includes("रिपोर्ट") || qLower.includes("मेरा") || qLower.includes("विवरण");
    const isWeatherQuery = qLower.includes("rain") || qLower.includes("barish") || qLower.includes("weather") || qLower.includes("बारिश") || qLower.includes("मौसम") || qLower.includes("पाऊस") || qLower.includes("ಮಳೆ");
    const isSoilQuery = qLower.includes("soil") || qLower.includes("ph") || qLower.includes("npk") || qLower.includes("urea") || qLower.includes("dap") || qLower.includes("खाद") || qLower.includes("मिट्टी");
    const isCropQuery = qLower.includes("crop") || qLower.includes("ugaye") || qLower.includes("फसल") || qLower.includes("પાલક");

    if (isHindiRequest || language === "Hindi") {
        if (isWeatherQuery) {
            return `🌱 **मौसम जानकारी (Open-Meteo डेटा)**:
• **FACT (मौसम पूर्वानुमान)**: कल बारिश होने की संभावना **${tomRain}%** है (अनुमानित बारिश: **${tomSum} mm**)।
• **RECOMMENDATION (सलाह)**: ${tomRain >= 50 ? "कल बारिश की संभावना अधिक है, इसलिए आज कीटनाशक या रासायनिक खाद का छिड़काव न करें और सिंचाई रोक दें।" : "मौसम साफ़ रहेगा। आप सामान्य सिंचाई कर सकते हैं।"}`;
        }
        if (isReportQuery) {
            return `🌱 **आपकी मृदा एवं कृषि रिपोर्ट (हिंदी)**:
• **खेत स्वास्थ्य सूचकांक**: ${sensor.farmHealth ?? 85}/100
• **मिट्टी की नमी**: ${sensor.moisture ?? 45}%
• **pH स्तर**: ${sensor.soilPH ?? 6.57} (उत्कृष्ट)
• **सलाह**: ${report.summary}`;
        }
        if (isSoilQuery) {
            return `🌱 **मिट्टी एवं पोषक तत्व सलाह**:
• **pH स्तर**: ${sensor.soilPH ?? 6.57} (अनुकूल neutral)
• **NPK स्थिति**: नाइट्रोजन (${sensor.nitrogen ?? 67} mg/kg), फास्फोरस (${sensor.phosphorus ?? 60} mg/kg), पोटेशियम (${sensor.potassium ?? 84} mg/kg)
• **सलाह**: यूरिया और डीएपी का अनावश्यक छिड़काव रोकें और पैसे बचाएं।`;
        }
        if (isCropQuery) {
            return `🌱 **अनुशंसित प्रमुख फसलें**:
1. **गेहूँ (Wheat)** - आपके neutral pH मिट्टी के लिए सर्वोत्तम।
2. **सरसों (Mustard)** - कम पानी और उच्च लाभ।
3. **चना / टमाटर** - समृद्ध NPK स्थिति से बंपर पैदावार मिलेगी।`;
        }
        return `🌱 **कृषिसायोग एआई सलाहकार**:
नमस्ते! आपकी रिपोर्ट के अनुसार आपके खेत का स्वास्थ्य **${sensor.farmHealth ?? 85}/100** है। मिट्टी में नमी **${sensor.moisture ?? 45}%** और pH **${sensor.soilPH ?? 6.57}** है। आप मौसम, सिंचाई, खाद या फ़सलों के बारे में कोई भी सवाल पूछ सकते हैं!`;
    }

    if (isWeatherQuery) {
        return `🌱 **Weather Forecast Advisory**:
• **FACT (Open-Meteo)**: Tomorrow's rain probability is **${tomRain}%** (expected rain: **${tomSum} mm**).
• **RECOMMENDATION**: ${tomRain >= 50 ? "Since rain is expected tomorrow, postpone chemical fertilizer spraying today and save your irrigation costs." : "Weather is clear. Light irrigation and normal farming can proceed."}`;
    }

    if (isReportQuery) {
        return `🌱 **Official Farm Advisory Report Summary**:
• **Farm Health Score**: ${sensor.farmHealth ?? 85}/100 (${sensor.farmHealth && sensor.farmHealth >= 75 ? 'Optimal' : 'Good'})
• **Soil Moisture**: ${sensor.moisture ?? 58}%
• **Soil pH**: ${sensor.soilPH ?? 6.57}
• **Summary**: ${report.summary}`;
    }

    if (isSoilQuery) {
        return `🌱 **Soil Health & Fertilizer Analysis**:
• **pH**: ${sensor.soilPH ?? 6.57} (Optimal neutral). Essential nutrients are naturally bioavailable.
• **NPK**: Nitrogen (${sensor.nitrogen ?? 67} mg/kg), Phosphorus (${sensor.phosphorus ?? 60} mg/kg), Potassium (${sensor.potassium ?? 84} mg/kg).
• **Action**: Skip unnecessary Urea/DAP applications today to reduce fertilizer costs.`;
    }

    if (isCropQuery) {
        return `🌱 **Top Recommended Crops for Your Soil**:
${(report.recommendedCrops || ["Wheat (Gehun)", "Mustard (Sarson)", "Chickpea (Chana)", "Tomato / Potato"]).map((c, i) => `${i + 1}. **${c}**`).join("\n")}`;
    }

    return `🌱 **KrishiSayog AI Advisory**:
Regarding your question "${q}":
Based on your sensor telemetry (pH ${sensor.soilPH ?? 6.57}, Moisture ${sensor.moisture ?? 58}%, NPK ${sensor.nitrogen ?? 67}-${sensor.phosphorus ?? 60}-${sensor.potassium ?? 84}), your farm health index is **${sensor.farmHealth ?? 85}/100**.
Check the report tab for full agronomic action items!`;
}

function getDayName(dateStr: string, index: number): string {
    if (index === 0) return "Today";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(dateStr);
    return days[d.getDay()];
}

function extractSection(text: string, title: string, fallback: string): string {
    const regex = new RegExp(`###\\s*\\d*\\.?\\s*${title}[\\s\\S]*?(?=###|$)`, "i");
    const match = text.match(regex);
    if (match) {
        return match[0].replace(/###\s*\d*\.?\s*[\w\s&]+/i, "").trim();
    }
    return fallback;
}

function generateOfflineFallbackReport(
    data: any,
    topCropNames: string[] = [],
    language: string = "English",
    weatherData?: WeatherData | null
): FarmAIReport {
    const crops = topCropNames.length > 0 ? topCropNames : ["Wheat (Gehun)", "Mustard (Sarson)", "Chickpea (Chana)", "Tomato / Potato"];
    const category = data.farmHealth >= 80 ? "Excellent" : data.farmHealth >= 65 ? "Good" : data.farmHealth >= 50 ? "Fair" : "Poor";
    const tomRain = weatherData?.daily?.precipitationProbabilityMax?.[1] ?? 0;

    const fullMarkdown = `
Namaste! I am KrishiSayog AI, your Agronomist and Soil Health Specialist.

Congratulations! Your farm's Overall Health Index has reached a stellar **${data.farmHealth}/100 (${category} Condition)**.

• **FACT (Open-Meteo Weather)**: Tomorrow's precipitation chance is **${tomRain}%**.
• **Soil & Moisture**: Soil moisture is at **${data.moisture}%**.
• **Nutrient Profile**: Nitrogen (${data.nitrogen} mg/kg), Phosphorus (${data.phosphorus} mg/kg), and Potassium (${data.potassium} mg/kg) are well balanced.

### Soil Health & Nutrient Advisory
- **pH Level (${data.soilPH}) - Optimal**: Soil pH is bioavailable.
- **Nitrogen & NPK**: Abundant fertility. Skip extra chemical applications.

### Irrigation & Water Management
- **Immediate Action**: ${tomRain >= 60 ? `Tomorrow has a ${tomRain}% rain chance. Hold off on irrigation today!` : "Soil moisture is good. Water only as needed."}

### Top Recommended Crops
${crops.map((c, i) => `${i + 1}. **${c}**`).join("\n")}
`;

    return {
        summary: `Namaste! Farm Health Index: ${data.farmHealth}/100. Tomorrow's Rain Chance: ${tomRain}%. Moisture: ${data.moisture}%.`,
        soilHealthScore: data.farmHealth,
        healthCategory: category,
        npkAnalysis: `N: ${data.nitrogen}, P: ${data.phosphorus}, K: ${data.potassium}`,
        phAnalysis: `pH ${data.soilPH} (Optimal)`,
        irrigationAdvice: tomRain >= 60 ? "Hold off on irrigation; high rain chance tomorrow." : "Soil moisture is good.",
        recommendedCrops: crops,
        actionItems: ["Check rain forecast before irrigating", "Pause chemical fertilizer application today"],
        fullMarkdown,
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        language
    };
}
