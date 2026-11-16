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

// Verified active Gemini models for this API Key
const MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.5-pro"
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
        moisture: Number((sensorData.moisture ?? 45).toFixed(1)),
        temperature: Number((sensorData.temperature ?? 28).toFixed(1)),
        humidity: Number((sensorData.humidity ?? 65).toFixed(1)),
        soilPH: Number((sensorData.soilPH ?? 6.5).toFixed(2)),
        soilTemp: Number((sensorData.soilTemp ?? 25).toFixed(1)),
        nitrogen: Number((sensorData.nitrogen ?? 42).toFixed(1)),
        phosphorus: Number((sensorData.phosphorus ?? 35).toFixed(1)),
        potassium: Number((sensorData.potassium ?? 55).toFixed(1)),
        farmHealth: Math.round(sensorData.farmHealth ?? 85),
        lightIntensity: Math.round(sensorData.lightIntensity ?? 45000),
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
Location: ${weatherData.locationName || weatherData.location || "Davangere, Karnataka"} (Lat: ${weatherData.latitude}, Lon: ${weatherData.longitude})
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
You are KrishiSayog AI — India's premier Agricultural Scientist, Agronomist, and Smart Farming Consultant.
Analyze the IoT sensor readings and Open-Meteo live weather data below to generate an IN-DEPTH, SCIENTIFIC, AND HIGHLY ACTIONABLE Soil Health & Agronomic Advisory Report for the farmer.

LANGUAGE REQUIREMENT:
Generate the entire report completely in ${language}. All section headings, explanations, scientific details, fertilizer doses, and steps must be in ${language}.

${weatherContextPrompt}

CURRENT SENSOR TELEMETRY:
- Soil Moisture: ${defaultData.moisture}% (Target: 40-70%)
- Air Temperature: ${defaultData.temperature}°C
- Air Humidity: ${defaultData.humidity}%
- Soil pH: ${defaultData.soilPH} (Target: 6.0 - 7.5)
- Soil Temperature: ${defaultData.soilTemp}°C
- Nitrogen (N): ${defaultData.nitrogen} mg/kg (Optimal: 40-80 mg/kg)
- Phosphorus (P): ${defaultData.phosphorus} mg/kg (Optimal: 30-60 mg/kg)
- Potassium (K): ${defaultData.potassium} mg/kg (Optimal: 40-80 mg/kg)
- Overall Farm Health Index: ${defaultData.farmHealth}/100
- Sunlight: ${defaultData.lightIntensity} Lux

ENGINE TOP CROPS: ${topCropNames.join(", ")}

STRUCTURE YOUR DETAILED REPORT WITH THESE EXACT HEADINGS IN ${language}:

### Executive Agronomic Summary
Provide a thorough 150-word overview. Congratulate the farmer on their ${defaultData.farmHealth}/100 score, explain what the current environmental balance means for their upcoming harvest, and list key sensor highlights in bullet points with real-world significance.

### Comprehensive Soil Health & Nutrient Advisory
- **Soil pH (${defaultData.soilPH})**: Explain soil acidity/alkalinity impact on microbial activity and nutrient uptake. Mention corrective measures (agricultural lime if < 6.0, gypsum/sulfur if > 7.5).
- **Nitrogen Analysis (${defaultData.nitrogen} mg/kg)**: Explain vegetative growth, chlorophyll synthesis, and exact Urea dosage per acre.
- **Phosphorus Analysis (${defaultData.phosphorus} mg/kg)**: Explain root vigor, blooming, energy transfer (ATP), and DAP/SSP recommendations per acre.
- **Potassium Analysis (${defaultData.potassium} mg/kg)**: Explain drought resilience, stalk strength, grain filling, and Muriate of Potash (MOP) dosage.
- **Organic Enrichment Plan**: Prescribe Vermicompost, Farm Yard Manure (FYM), or Jeevamrutha application with quantities.

### Smart Irrigation & Water Management
- **Current Moisture Analysis (${defaultData.moisture}%)**: Detail root zone aeration, capillary water status, and stress levels.
- **Immediate Action Today**: Specify whether to turn on irrigation or halt based on current moisture and rain forecasts.
- **7-Day Weather-Linked Irrigation Schedule**: Specific irrigation frequency matching the 7-day rainfall probabilities.
- **Water & Power Saving Tips**: Automated valve control and drip timing recommendations.

### Crop Suitability & High-Yield Strategy
For EACH of the recommended crops (${topCropNames.join(", ")}):
1. **Agronomic Match**: Why this crop thrives in current soil pH (${defaultData.soilPH}) and moisture (${defaultData.moisture}%).
2. **Expected Yield & Growth Duration**: Potential quintals/acre and harvesting timeline.
3. **Nutrient Management & Pest Warnings**: Specific fertilizer stages and pests to scout for.

### Pest, Disease & Risk Forecast
Based on current temperature (${defaultData.temperature}°C) and humidity (${defaultData.humidity}%):
- Identify fungal or insect risks (e.g. Blight, Powdery Mildew, Aphids).
- Recommend biological/organic preventives (Neem oil 10,000 ppm, Trichoderma) and targeted eco-friendly controls.

### 7-Day Farmer Action Checklist
Provide a prioritized, numbered 7-day checklist (Day 1 to Day 7) instructing the farmer on field inspections, fertilizer top-dressing, irrigation timing, and weed control.
`;

    if (genAI) {
        for (const modelName of MODELS) {
            try {
                console.log(`🤖 KrishiSayog Report AI: Generating detailed report in ${language} with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                if (responseText && responseText.length > 300) {
                    const category: "Excellent" | "Good" | "Fair" | "Poor" =
                        defaultData.farmHealth >= 80 ? "Excellent" :
                        defaultData.farmHealth >= 65 ? "Good" :
                        defaultData.farmHealth >= 50 ? "Fair" : "Poor";

                    const rawSummary = extractSection(responseText, "Executive Agronomic Summary", responseText.slice(0, 300));
                    const rawNutrient = extractSection(responseText, "Comprehensive Soil Health & Nutrient Advisory", "Soil nutrient levels are rich and balanced.");
                    const rawIrrigation = extractSection(responseText, "Smart Irrigation & Water Management", "Soil moisture is well balanced.");

                    return {
                        summary: rawSummary,
                        soilHealthScore: defaultData.farmHealth,
                        healthCategory: category,
                        npkAnalysis: rawNutrient,
                        phAnalysis: `Soil pH is ${defaultData.soilPH} (${defaultData.soilPH >= 6.0 && defaultData.soilPH <= 7.5 ? 'Optimal' : 'Needs attention'}).`,
                        irrigationAdvice: rawIrrigation,
                        recommendedCrops: topCropNames.length > 0 ? topCropNames : ["Wheat (Gehun)", "Mustard (Sarson)", "Chickpea (Chana)", "Tomato / Potato"],
                        actionItems: [
                            "Day 1: Monitor root zone moisture before scheduling morning irrigation.",
                            "Day 2: Soil pH adjustment - apply organic compost to maintain microbial balance.",
                            "Day 3: Check weather forecast before any foliar or fertilizer spray.",
                            "Day 4: Inspect leaf undersides for early signs of fungal or aphid infestation.",
                            "Day 5: Top-dress Nitrogen/Phosphorus based on crop growth stage.",
                            "Day 6: Clean irrigation filters and ensure uniform water distribution.",
                            "Day 7: Record crop height and review weekly farm health index."
                        ],
                        fullMarkdown: responseText,
                        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                        language
                    };
                }
            } catch (err: any) {
                console.warn(`⚠️ Report AI: ${modelName} failed:`, err.message);
            }
        }
    }

    console.warn("⚠️ Using Deep Agronomic Rules Engine for detailed comprehensive report.");
    return generateDeepAgronomicReport(defaultData, topCropNames, language, weatherData);
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
- Location: ${weatherData.locationName || weatherData.location || "Davangere, Karnataka"}

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
1. For ANY question about weather, answer strictly using the FACTUAL numbers from Open-Meteo supplied above.
2. NEVER invent precipitation percentages or rain values.
3. Clearly distinguish FACT (from Open-Meteo) from RECOMMENDATION (AI agricultural advice).
4. Be warm, encouraging, polite, and practical.`;

    if (genAI) {
        for (const modelName of MODELS) {
            try {
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
    }

    const fallbackText = generateSmartQueryFallback(userQuestion, reportContext, sensorData, language, weatherData);
    onStream(fallbackText);
    return fallbackText;
}

// Deep Agronomic Rules Engine to build an extensive, fully detailed report if API is offline
function generateDeepAgronomicReport(
    data: SensorReading,
    topCropNames: string[] = [],
    language: string = "English",
    weatherData?: WeatherData | null
): FarmAIReport {
    const crops = topCropNames.length > 0 ? topCropNames : ["Brinjal (Eggplant)", "Tomato", "Wheat", "Maize"];
    const category: "Excellent" | "Good" | "Fair" | "Poor" =
        data.farmHealth >= 80 ? "Excellent" :
        data.farmHealth >= 65 ? "Good" :
        data.farmHealth >= 50 ? "Fair" : "Poor";

    const tomRain = weatherData?.daily?.precipitationProbabilityMax?.[1] ?? 0;
    const tomSum = weatherData?.daily?.precipitationSum?.[1] ?? 0;
    const tomDesc = weatherData?.daily?.description?.[1] || "Clear to Partly Cloudy";
    const tomTempMax = weatherData?.daily?.temperatureMax?.[1] ?? 31;
    const tomTempMin = weatherData?.daily?.temperatureMin?.[1] ?? 22;

    const isHindi = language === "Hindi";

    // Dynamic scientific analysis based on numbers
    const phStatus = data.soilPH < 6.0 
        ? (isHindi ? "अम्लीय (Acidic)" : "Slightly Acidic") 
        : data.soilPH > 7.5 
        ? (isHindi ? "क्षारीय (Alkaline)" : "Moderately Alkaline") 
        : (isHindi ? "सर्वोत्तम उदासीन (Optimal Neutral)" : "Ideal Neutral (6.0 - 7.5)");

    const phAdvice = data.soilPH < 6.0
        ? (isHindi ? "मिट्टी की अम्लता कम करने के लिए प्रति एकड़ 150-200 किग्रा बुझा हुआ चूना (Agricultural Lime) या लकड़ी की राख डालें।" : "Apply 150-200 kg/acre of Agricultural Lime or dolomite to gradually raise the pH towards 6.5.")
        : data.soilPH > 7.5
        ? (isHindi ? "मिट्टी के क्षारीय प्रभाव को संतुलित करने के लिए जिप्सम (100 किग्रा/एकड़) या हरी खाद (ढैंचा/सनई) का उपयोग करें।" : "Apply Gypsum @ 100 kg/acre and incorporate green manure (Sesbania) to buffer soil alkalinity.")
        : (isHindi ? "आपकी मिट्टी का pH प्राकृतिक रूप से संतुलित है। इस स्तर पर सभी आवश्यक पोषक तत्व (N, P, K, Fe, Zn) पौधों की जड़ों द्वारा तुरंत अवशोषित हो जाते हैं।" : "Your soil pH is in the golden zone. All primary macronutrients and micronutrients remain naturally bioavailable without lockup.");

    const moistureStatus = data.moisture < 30
        ? (isHindi ? "कम नमी (Dry/Under-irrigated)" : "Dry / Water Stressed (<30%)")
        : data.moisture > 70
        ? (isHindi ? "अत्यधिक नमी (Waterlogged/Saturated)" : "High Saturation (>70%)")
        : (isHindi ? "आदर्श नमी स्तर (Optimal Field Capacity)" : "Optimal Field Capacity (40-70%)");

    const irrigationPlan = tomRain >= 50
        ? (isHindi ? `कल बारिश की संभावना ${tomRain}% (${tomSum} mm) है। आज सिंचाई तुरंत स्थगित रखें ताकि जलभराव और पोषक तत्वों का बहाव रोका जा सके। प्रति एकड़ लगभग ₹400-₹600 की बिजली और पानी की सीधी बचत होगी।` : `Rain probability tomorrow is ${tomRain}% with expected precipitation of ${tomSum} mm. Postpone irrigation immediately today to prevent root hypoxia and nutrient leaching, saving ₹400-₹600 per acre in pumping energy.`)
        : data.moisture < 35
        ? (isHindi ? `मिट्टी में नमी घटकर ${data.moisture}% रह गई है। मौसम साफ़ है (${tomDesc}), इसलिए शाम के समय ड्रिप सिंचाई से 2-3 घंटे हल्की सिंचाई करें।` : `Soil moisture is at ${data.moisture}%. Weather is clear (${tomDesc}). Schedule 2-3 hours of drip irrigation during cooler evening hours to minimize evaporative loss.`)
        : (isHindi ? `मिट्टी में ${data.moisture}% नमी पर्याप्त है। आने वाले 48 घंटों तक अतिरिक्त पानी देने की आवश्यकता नहीं है।` : `Moisture at ${data.moisture}% is well within safe thresholds. No immediate irrigation needed for the next 48 hours.`);

    let fullMarkdown = "";

    if (isHindi) {
        fullMarkdown = `
### Executive Agronomic Summary
नमस्ते किसान भाई! कृषिसायोग एआई स्मार्ट फार्मिंग सिस्टम में आपका स्वागत है। आपके खेत का समग्र स्वास्थ्य सूचकांक **${data.farmHealth}/100 (${category === 'Excellent' ? 'उत्कृष्ट' : category === 'Good' ? 'अच्छा' : 'संतोषजनक'} स्थिति)** पर है। आपके खेत के IoT सेंसर और ओपन-मेटियो मौसम पूर्वानुमान के अनुसार आपकी फसल की स्थिति स्थिर है।

• **मिट्टी की नमी**: ${data.moisture}% (${moistureStatus}) - जड़ों के विकास के लिए अनुकूल।
• **तापमान एवं आर्द्रता**: परिवेश का तापमान ${data.temperature}°C और आर्द्रता ${data.humidity}% दर्ज की गई है।
• **पोषक तत्व स्थिति (NPK)**: नाइट्रोजन ${data.nitrogen} mg/kg, फॉस्फोरस ${data.phosphorus} mg/kg, पोटेशियम ${data.potassium} mg/kg।
• **मौसम पूर्वानुमान**: कल अधिकतम तापमान ${tomTempMax}°C, न्यूनतम ${tomTempMin}°C और बारिश की संभावना **${tomRain}%** (${tomSum} mm) है।

### Comprehensive Soil Health & Nutrient Advisory
- **मृदा pH विश्लेषण (${data.soilPH} - ${phStatus})**: ${phAdvice}
- **नाइट्रोजन (N - ${data.nitrogen} mg/kg)**: ${data.nitrogen < 40 ? 'नाइट्रोजन का स्तर कम है जिससे पत्तियों में पीलापन आ सकता है। प्रति एकड़ 30-40 किग्रा यूरिया की पहली खुराक सिंचाई के साथ दें।' : 'नाइट्रोजन पर्याप्त मात्रा में है। पत्तियों का हरापन और वानस्पतिक वृद्धि शानदार रहेगी। अत्यधिक यूरिया डालने से बचें।'}
- **फॉस्फोरस (P - ${data.phosphorus} mg/kg)**: ${data.phosphorus < 30 ? 'जड़ों की मजबूती और कल्ले फूटने के लिए डीएपी (DAP) @ 50 किग्रा/एकड़ बुवाई या जुताई के समय दें।' : 'फॉस्फोरस का स्तर उत्तम है। जड़ें गहराई तक विकसित होंगी और फूल व फलियों का विकास बेहतर होगा।'}
- **पोटेशियम (K - ${data.potassium} mg/kg)**: ${data.potassium < 40 ? 'रोग प्रतिरोधक क्षमता और दानों की चमक बढ़ाने के लिए म्यूटेट ऑफ पोटाश (MOP) 25 किग्रा/एकड़ दें।' : 'पोटेशियम प्रचुर मात्रा में है जिससे फसल सूखा और कीटों के प्रति अत्यधिक सहनशील बनी रहेगी।'}
- **जैविक खाद एवं सूक्ष्मजीव सिफारिश**: मिट्टी में कार्बनिक पदार्थ बढ़ाने के लिए प्रति एकड़ 2 टन अच्छी सड़ी गोबर की खाद (FYM) या 500 किग्रा वर्मीकम्पोस्ट का प्रयोग करें।

### Smart Irrigation & Water Management
- **वर्तमान नमी स्थिति**: ${data.moisture}% (${moistureStatus})।
- **आज का सिंचाई निर्णय**: ${irrigationPlan}
- **साप्ताहिक सिंचाई योजना**: सप्ताह के मध्य में जब नमी 35% से नीचे आए तभी सिंचाई करें। ड्रिप पद्धति अपनाकर 40% तक पानी की बचत करें।

### Crop Suitability & High-Yield Strategy
${crops.map((c, i) => `${i + 1}. **${c}**: 
   - *अनुकूलता*: वर्तमान pH (${data.soilPH}) और तापमान (${data.temperature}°C) में यह फसल तेजी से अंकुरित और विकसित होगी।
   - *अनुमानित पैदावार*: 18-25 क्विंटल/एकड़ (उचित प्रबंधन से)।
   - *देखभाल*: कल्ले फूटते समय हल्की सिंचाई और 19:19:19 एनपीके का पर्णीय छिड़काव करें।`).join("\n\n")}

### Pest, Disease & Risk Forecast
- **आर्द्रता एवं तापमान प्रभाव**: वर्तमान तापमान (${data.temperature}°C) और आर्द्रता (${data.humidity}%) को देखते हुए पत्ती धब्बा (Leaf Spot) और पाउडरी मिल्ड्यू फंगस का हल्का खतरा बन सकता है।
- **रोकथाम**: नीम का तेल (Neem Oil 10,000 ppm) @ 3 ml प्रति लीटर पानी में मिलाकर शाम के समय छिड़कें। रासायनिक उपचार के रूप में आवश्यकता पड़ने पर साफ (Saaf - Carbendazim + Mancozeb) @ 2 ग्राम/लीटर का छिड़काव करें।

### 7-Day Farmer Action Checklist
1. **दिन 1**: सिंचाई से पहले खेत की मिट्टी को हाथ से छूकर नमी की वास्तविक जांच करें।
2. **दिन 2**: मौसम पूर्वानुमान पर नजर रखें; बारिश की संभावना (${tomRain}%) होने पर कीटनाशक स्प्रे टालें।
3. **दिन 3**: खरपतवार नियंत्रण करें ताकि मुख्य फसल के पोषक तत्वों में प्रतिस्पर्धा न हो।
4. **दिन 4**: पत्तियों की निचली सतह पर रस चूसक कीटों (माहू/थ्रिप्स) की निगरानी करें।
5. **दिन 5**: आवश्यकतानुसार सूक्ष्म पोषक तत्व मिश्रण (Micronutrient Mix) 2 ग्राम/लीटर का छिड़काव करें।
6. **दिन 6**: ड्रिप लाइनों और फिल्टर की सफाई करें ताकि पानी का समान वितरण बना रहे।
7. **दिन 7**: कृषिसायोग ऐप पर दोबारा सेंसर रीडिंग चेक करके साप्ताहिक प्रगति की समीक्षा करें।
`;
    } else {
        fullMarkdown = `
### Executive Agronomic Summary
Welcome Farmer! KrishiSayog AI has processed your real-time farm IoT telemetry and local Open-Meteo weather intelligence. Your farm's Overall Health Index currently stands at **${data.farmHealth}/100 (${category} Condition)**. The vegetative and soil metrics indicate positive growing conditions with balanced nutrient reserves.

• **Soil Moisture**: ${data.moisture}% (${moistureStatus}) - within effective capillary moisture range.
• **Microclimate**: Ambient Temperature at ${data.temperature}°C with relative humidity at ${data.humidity}%.
• **NPK Availability**: Nitrogen ${data.nitrogen} mg/kg, Phosphorus ${data.phosphorus} mg/kg, Potassium ${data.potassium} mg/kg.
• **Weather Forecast**: Tomorrow's highs reaching ${tomTempMax}°C, lows at ${tomTempMin}°C, with **${tomRain}% rain probability** (${tomSum} mm).

### Comprehensive Soil Health & Nutrient Advisory
- **Soil pH Level (${data.soilPH} - ${phStatus})**: ${phAdvice}
- **Nitrogen Dynamics (${data.nitrogen} mg/kg)**: ${data.nitrogen < 40 ? 'Nitrogen reserve is low. Chlorophyll synthesis may slow down. Apply top-dressed Urea @ 35 kg/acre during early vegetative stage.' : 'Nitrogen levels are ample. Excellent foliage development expected. Avoid excessive nitrogenous inputs to prevent lodging.'}
- **Phosphorus Reserves (${data.phosphorus} mg/kg)**: ${data.phosphorus < 30 ? 'Phosphorus is sub-optimal. Apply DAP @ 45 kg/acre or Single Super Phosphate (SSP) to boost root elongation.' : 'Phosphorus level is optimal. Root network establishment and flowering vigor will be strong.'}
- **Potassium Reserves (${data.potassium} mg/kg)**: ${data.potassium < 40 ? 'Potassium is low. Apply Muriate of Potash (MOP) @ 25 kg/acre to improve drought tolerance and grain weight.' : 'Potassium abundance supports thick cell walls, strong disease defense, and superior produce shine.'}
- **Organic Bio-Enrichment**: Supplement with 500 kg/acre of enriched vermicompost or apply Jeevamrutha every 15 days to enhance beneficial soil microbes.

### Smart Irrigation & Water Management
- **Soil Hydration Status**: Measured at ${data.moisture}% (${moistureStatus}).
- **Immediate Action Today**: ${irrigationPlan}
- **7-Day Water Strategy**: Prioritize water conservation. Trigger irrigation only when root-zone moisture dips below 35%. Employ drip irrigation to save up to 40% water and pumping electricity.

### Crop Suitability & High-Yield Strategy
${crops.map((c, i) => `${i + 1}. **${c}**: 
   - *Soil Synergy*: High suitability with current pH (${data.soilPH}) and temperature (${data.temperature}°C).
   - *Yield Projection*: 18-24 quintals per acre under optimized precision farming practices.
   - *Management Tip*: Apply balanced NPK 19:19:19 foliar spray at vegetative branch development stage.`).join("\n\n")}

### Pest, Disease & Risk Forecast
- **Microclimate Threat Assessment**: Ambient temperature of ${data.temperature}°C paired with ${data.humidity}% humidity may create micro-niches for early fungal spore germination (Early Blight or Powdery Mildew).
- **Proactive Protection**: Spray cold-pressed Neem Oil (10,000 ppm) @ 3ml/litre with liquid soap as an organic deterrent. For fungal outbreaks, use Mancozeb 75% WP @ 2g/litre of water during calm morning hours.

### 7-Day Farmer Action Checklist
1. **Day 1**: Validate soil moisture readings across different quadrants of the plot before irrigating.
2. **Day 2**: Review tomorrow's rain forecast (${tomRain}%); delay chemical spraying if precipitation is imminent.
3. **Day 3**: Carry out light intercultural weeding around crop root zones.
4. **Day 4**: Inspect leaf undersides for aphid colonies or whitefly presence.
5. **Day 5**: Apply foliar micronutrient spray (Zinc + Boron) if new leaves show chlorosis.
6. **Day 6**: Flush drip irrigation lateral lines to remove sediment buildup.
7. **Day 7**: Recalibrate IoT sensor nodes and monitor updated KrishiSayog health analytics.
`;
    }

    return {
        summary: isHindi 
            ? `खेत स्वास्थ्य: ${data.farmHealth}/100 (${category === 'Excellent' ? 'उत्कृष्ट' : 'संतोषजनक'})। कल बारिश की संभावना: ${tomRain}% (${tomSum} mm)। मिट्टी में नमी: ${data.moisture}%, pH: ${data.soilPH}।`
            : `Farm Health Index: ${data.farmHealth}/100 (${category}). Tomorrow Rain: ${tomRain}% (${tomSum} mm). Moisture: ${data.moisture}%, pH: ${data.soilPH}.`,
        soilHealthScore: data.farmHealth,
        healthCategory: category,
        npkAnalysis: `N: ${data.nitrogen} mg/kg | P: ${data.phosphorus} mg/kg | K: ${data.potassium} mg/kg`,
        phAnalysis: `pH ${data.soilPH} (${phStatus})`,
        irrigationAdvice: irrigationPlan,
        recommendedCrops: crops,
        actionItems: [
            "Check soil moisture before irrigating",
            "Hold off on foliar spray if rain probability > 50%",
            "Apply bio-fertilizer / vermicompost around root zones",
            "Scout for early fungal or sucking pests",
            "Maintain clean drip laterals and filters"
        ],
        fullMarkdown,
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        language
    };
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
    const isCropQuery = qLower.includes("crop") || qLower.includes("ugaye") || qLower.includes("फसल") || qLower.includes("पिकांची");

    if (isHindiRequest || language === "Hindi") {
        if (isWeatherQuery) {
            return `🌱 **मौसम पूर्वानुमान (Open-Meteo)**:
• **FACT**: कल बारिश की संभावना **${tomRain}%** है (अनुमानित वर्षा: **${tomSum} mm**)।
• **सलाह**: ${tomRain >= 50 ? "कल बारिश की प्रबल संभावना है, अतः सिंचाई तुरंत रोक दें और कीटनाशक छिड़काव स्थगित रखें।" : "मौसम साफ़ रहेगा। आप सामान्य सिंचाई कर सकते हैं।"}`;
        }
        if (isReportQuery) {
            return `🌱 **आपकी विस्तृत खेत रिपोर्ट संक्षेप**:
• **खेत स्वास्थ्य स्कोर**: ${sensor.farmHealth ?? 85}/100
• **मिट्टी की नमी**: ${sensor.moisture ?? 45}%
• **pH मान**: ${sensor.soilPH ?? 6.57}
• **सलाह**: ${report.summary}`;
        }
        if (isSoilQuery) {
            return `🌱 **मृदा स्वास्थ्य एवं खाद सलाह**:
• **pH**: ${sensor.soilPH ?? 6.57} (अनुकूल)
• **NPK**: नाइट्रोजन (${sensor.nitrogen ?? 42} mg/kg), फॉस्फोरस (${sensor.phosphorus ?? 35} mg/kg), पोटेशियम (${sensor.potassium ?? 55} mg/kg)
• **सलाह**: यूरिया की संतुलित मात्रा (35 किग्रा/एकड़) सिंचाई के साथ दें। वर्मीकम्पोस्ट का प्रयोग अवश्य करें।`;
        }
        if (isCropQuery) {
            return `🌱 **प्रमुख अनुशंसित फसलें**:
${(report.recommendedCrops || ["बैंगन (Brinjal)", "टमाटर (Tomato)", "गेहूँ (Wheat)", "मक्का (Maize)"]).map((c, i) => `${i + 1}. **${c}**`).join("\n")}`;
        }
        return `🌱 **कृषिसायोग एआई सलाहकार**:
नमस्ते! आपके खेत का स्वास्थ्य **${sensor.farmHealth ?? 85}/100** है। मिट्टी में नमी **${sensor.moisture ?? 45}%** और pH **${sensor.soilPH ?? 6.57}** है। आप मौसम, सिंचाई, खाद या फसल चयन के बारे में कोई भी सवाल पूछ सकते हैं!`;
    }

    if (isWeatherQuery) {
        return `🌱 **Weather Forecast Advisory**:
• **FACT (Open-Meteo)**: Tomorrow's rain probability is **${tomRain}%** (expected rain: **${tomSum} mm**).
• **RECOMMENDATION**: ${tomRain >= 50 ? "Since rain is expected tomorrow, postpone chemical fertilizer spraying today and save your irrigation costs." : "Weather is clear. Light irrigation and normal farming can proceed."}`;
    }

    if (isReportQuery) {
        return `🌱 **Official Farm Advisory Report Summary**:
• **Farm Health Score**: ${sensor.farmHealth ?? 85}/100
• **Soil Moisture**: ${sensor.moisture ?? 45}%
• **Soil pH**: ${sensor.soilPH ?? 6.57}
• **Summary**: ${report.summary}`;
    }

    if (isSoilQuery) {
        return `🌱 **Soil Health & Fertilizer Analysis**:
• **pH**: ${sensor.soilPH ?? 6.57} (Optimal neutral). Essential nutrients are naturally bioavailable.
• **NPK**: Nitrogen (${sensor.nitrogen ?? 42} mg/kg), Phosphorus (${sensor.phosphorus ?? 35} mg/kg), Potassium (${sensor.potassium ?? 55} mg/kg).
• **Action**: Apply 35 kg/acre Urea and 40 kg/acre DAP during root establishment. Supplement with compost.`;
    }

    if (isCropQuery) {
        return `🌱 **Top Recommended Crops for Your Soil**:
${(report.recommendedCrops || ["Brinjal (Eggplant)", "Tomato", "Wheat", "Maize"]).map((c, i) => `${i + 1}. **${c}**`).join("\n")}`;
    }

    return `🌱 **KrishiSayog AI Advisory**:
Regarding your question "${q}":
Based on your sensor telemetry (pH ${sensor.soilPH ?? 6.57}, Moisture ${sensor.moisture ?? 45}%, NPK ${sensor.nitrogen ?? 42}-${sensor.phosphorus ?? 35}-${sensor.potassium ?? 55}), your farm health index is **${sensor.farmHealth ?? 85}/100**.
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
