// AI Crop Recommendation Engine
// Generates recommendations based on live sensor data + weather + season
// Uses agronomic rules for Indian crops

import { type SensorReading, type WeatherData } from "./iotConfig";

export type CropRecommendation = {
    name: string;
    emoji: string;
    confidence: number;      // 0-100
    yieldPrediction: string; // e.g. "40-50 q/ha"
    season: string;          // Kharif / Rabi / Zaid
    waterNeed: "Low" | "Medium" | "High";
    growthDuration: string;  // e.g. "120-150 days"
    marketPrice: string;     // ₹ per quintal
    reasons: string[];       // Why this crop is recommended
    risks: string[];         // Potential risks
    soilMatch: number;       // 0-100 how well soil matches
    climateMatch: number;    // 0-100 how well climate matches
};

// Indian crop database with agronomic parameters
const CROP_DATABASE = [
    // --- CEREALS & GRAINS ---
    {
        name: "Rice (Paddy)", emoji: "🌾", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 22, max: 35 }, optimalMoisture: { min: 60, max: 80 }, optimalPH: { min: 5.5, max: 7.0 },
        optimalN: { min: 60, max: 120 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 40, max: 80 },
        waterNeed: "High" as const, growthDuration: "120-150 days", yieldRange: [35, 55], marketPrice: "₹2,183 (MSP)"
    },
    {
        name: "Wheat", emoji: "🌾", season: "Rabi", months: [10, 11, 12, 1, 2, 3],
        optimalTemp: { min: 12, max: 25 }, optimalMoisture: { min: 40, max: 60 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 50, max: 100 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 30, max: 60 },
        waterNeed: "Medium" as const, growthDuration: "120-140 days", yieldRange: [30, 50], marketPrice: "₹2,275 (MSP)"
    },
    {
        name: "Maize (Corn)", emoji: "🌽", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 21, max: 32 }, optimalMoisture: { min: 45, max: 65 }, optimalPH: { min: 5.8, max: 7.0 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 40, max: 80 },
        waterNeed: "Medium" as const, growthDuration: "90-110 days", yieldRange: [40, 70], marketPrice: "₹2,090 (MSP)"
    },
    {
        name: "Pearl Millet (Bajra)", emoji: "🌾", season: "Kharif", months: [6, 7, 8, 9],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 20, max: 40 }, optimalPH: { min: 6.0, max: 8.0 },
        optimalN: { min: 30, max: 60 }, optimalP: { min: 20, max: 40 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "70-90 days", yieldRange: [15, 30], marketPrice: "₹2,500 (MSP)"
    },
    {
        name: "Sorghum (Jowar)", emoji: "🌾", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 26, max: 33 }, optimalMoisture: { min: 25, max: 45 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 40, max: 80 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 30, max: 50 },
        waterNeed: "Low" as const, growthDuration: "100-120 days", yieldRange: [20, 35], marketPrice: "₹3,180 (MSP)"
    },
    {
        name: "Finger Millet (Ragi)", emoji: "🌾", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 20, max: 30 }, optimalMoisture: { min: 35, max: 55 }, optimalPH: { min: 5.0, max: 7.0 },
        optimalN: { min: 30, max: 50 }, optimalP: { min: 20, max: 40 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "90-120 days", yieldRange: [15, 25], marketPrice: "₹3,846 (MSP)"
    },

    // --- PULSES ---
    {
        name: "Chickpea (Chana)", emoji: "🥟", season: "Rabi", months: [10, 11, 12, 1, 2, 3],
        optimalTemp: { min: 15, max: 25 }, optimalMoisture: { min: 30, max: 50 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 15, max: 30 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "110-130 days", yieldRange: [15, 25], marketPrice: "₹5,440 (MSP)"
    },
    {
        name: "Pigeon Pea (Tur/Arhar)", emoji: "🫘", season: "Kharif", months: [6, 7, 8, 9, 10, 11],
        optimalTemp: { min: 26, max: 30 }, optimalMoisture: { min: 35, max: 55 }, optimalPH: { min: 6.5, max: 7.5 },
        optimalN: { min: 20, max: 30 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Medium" as const, growthDuration: "150-180 days", yieldRange: [12, 20], marketPrice: "₹7,000 (MSP)"
    },
    {
        name: "Black Gram (Urad)", emoji: "🫘", season: "Kharif", months: [6, 7, 8, 9],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 30, max: 50 }, optimalPH: { min: 6.5, max: 7.8 },
        optimalN: { min: 20, max: 30 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "80-90 days", yieldRange: [10, 15], marketPrice: "₹6,950 (MSP)"
    },
    {
        name: "Green Gram (Moong)", emoji: "🫘", season: "Zaid", months: [3, 4, 5],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 25, max: 45 }, optimalPH: { min: 6.5, max: 7.5 },
        optimalN: { min: 10, max: 20 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "60-70 days", yieldRange: [8, 12], marketPrice: "₹8,558 (MSP)"
    },
    {
        name: "Lentil (Masoor)", emoji: "🥣", season: "Rabi", months: [10, 11, 12, 1, 2, 3],
        optimalTemp: { min: 10, max: 20 }, optimalMoisture: { min: 25, max: 45 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 15, max: 30 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "110-130 days", yieldRange: [12, 18], marketPrice: "₹6,425 (MSP)"
    },

    // --- OILSEEDS ---
    {
        name: "Soybean", emoji: "🫘", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 20, max: 32 }, optimalMoisture: { min: 40, max: 70 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 20, max: 50 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 30, max: 70 },
        waterNeed: "Medium" as const, growthDuration: "90-120 days", yieldRange: [15, 25], marketPrice: "₹4,600 (MSP)"
    },
    {
        name: "Mustard", emoji: "🌼", season: "Rabi", months: [10, 11, 12, 1, 2, 3],
        optimalTemp: { min: 10, max: 25 }, optimalMoisture: { min: 30, max: 50 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 40, max: 80 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "110-140 days", yieldRange: [15, 25], marketPrice: "₹5,650 (MSP)"
    },
    {
        name: "Groundnut", emoji: "🥜", season: "Kharif", months: [6, 7, 8, 9, 10],
        optimalTemp: { min: 22, max: 33 }, optimalMoisture: { min: 35, max: 60 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 20, max: 40 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 30, max: 50 },
        waterNeed: "Low" as const, growthDuration: "100-130 days", yieldRange: [15, 25], marketPrice: "₹6,377 (MSP)"
    },
    {
        name: "Sunflower", emoji: "🌻", season: "Rabi", months: [10, 11, 12, 1, 2],
        optimalTemp: { min: 20, max: 30 }, optimalMoisture: { min: 35, max: 55 }, optimalPH: { min: 6.5, max: 8.0 },
        optimalN: { min: 40, max: 60 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 40, max: 60 },
        waterNeed: "Low" as const, growthDuration: "90-100 days", yieldRange: [12, 20], marketPrice: "₹6,760 (MSP)"
    },
    {
        name: "Sesame (Til)", emoji: "🥯", season: "Kharif", months: [6, 7, 8, 9],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 25, max: 45 }, optimalPH: { min: 5.5, max: 8.0 },
        optimalN: { min: 30, max: 50 }, optimalP: { min: 20, max: 40 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "80-90 days", yieldRange: [5, 10], marketPrice: "₹8,635 (MSP)"
    },

    // --- CASH CROPS ---
    {
        name: "Cotton", emoji: "🏵️", season: "Kharif", months: [4, 5, 6, 7, 8, 9, 10],
        optimalTemp: { min: 25, max: 38 }, optimalMoisture: { min: 30, max: 60 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 60, max: 100 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 30, max: 70 },
        waterNeed: "Medium" as const, growthDuration: "150-180 days", yieldRange: [15, 25], marketPrice: "₹6,620 (MSP)"
    },
    {
        name: "Sugarcane", emoji: "🎋", season: "Kharif", months: [1, 2, 3, 10, 11, 12],
        optimalTemp: { min: 20, max: 35 }, optimalMoisture: { min: 60, max: 85 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 100, max: 150 }, optimalP: { min: 40, max: 80 }, optimalK: { min: 60, max: 100 },
        waterNeed: "High" as const, growthDuration: "10-12 months", yieldRange: [600, 1000], marketPrice: "₹3,150 (FRP)"
    },
    {
        name: "Jute", emoji: "🧶", season: "Zaid", months: [2, 3, 4, 5, 6],
        optimalTemp: { min: 24, max: 35 }, optimalMoisture: { min: 70, max: 90 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 40, max: 80 }, optimalP: { min: 20, max: 40 }, optimalK: { min: 20, max: 40 },
        waterNeed: "High" as const, growthDuration: "100-120 days", yieldRange: [20, 30], marketPrice: "₹5,050 (MSP)"
    },
    {
        name: "Tea", emoji: "🍵", season: "Kharif", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Perennial
        optimalTemp: { min: 15, max: 30 }, optimalMoisture: { min: 60, max: 85 }, optimalPH: { min: 4.5, max: 5.5 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 40, max: 80 },
        waterNeed: "High" as const, growthDuration: "Perennial", yieldRange: [15, 25], marketPrice: "Market Linked"
    },
    {
        name: "Coffee", emoji: "☕", season: "Kharif", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Perennial
        optimalTemp: { min: 15, max: 28 }, optimalMoisture: { min: 55, max: 80 }, optimalPH: { min: 5.0, max: 6.5 },
        optimalN: { min: 60, max: 100 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 40, max: 80 },
        waterNeed: "Medium" as const, growthDuration: "Perennial", yieldRange: [5, 10], marketPrice: "Market Linked"
    },

    // --- VEGETABLES ---
    {
        name: "Tomato", emoji: "🍅", season: "Zaid", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        optimalTemp: { min: 18, max: 30 }, optimalMoisture: { min: 50, max: 75 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 60, max: 100 }, optimalP: { min: 40, max: 80 }, optimalK: { min: 60, max: 100 },
        waterNeed: "Medium" as const, growthDuration: "90-120 days", yieldRange: [250, 400], marketPrice: "₹1,500-2,500"
    },
    {
        name: "Onion", emoji: "🧅", season: "Rabi", months: [10, 11, 12, 1, 2, 3],
        optimalTemp: { min: 13, max: 28 }, optimalMoisture: { min: 40, max: 65 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 50, max: 80 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 40, max: 80 },
        waterNeed: "Medium" as const, growthDuration: "120-150 days", yieldRange: [200, 300], marketPrice: "₹1,200-2,000"
    },
    {
        name: "Potato", emoji: "🥔", season: "Rabi", months: [10, 11, 12, 1, 2],
        optimalTemp: { min: 15, max: 25 }, optimalMoisture: { min: 50, max: 70 }, optimalPH: { min: 5.5, max: 6.5 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 50, max: 80 }, optimalK: { min: 80, max: 120 },
        waterNeed: "Medium" as const, growthDuration: "90-110 days", yieldRange: [200, 350], marketPrice: "₹1,000-1,800"
    },
    {
        name: "Cabbage", emoji: "🥬", season: "Rabi", months: [9, 10, 11, 12, 1, 2],
        optimalTemp: { min: 15, max: 22 }, optimalMoisture: { min: 60, max: 80 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 60, max: 90 },
        waterNeed: "High" as const, growthDuration: "80-100 days", yieldRange: [250, 400], marketPrice: "₹800-1,500"
    },
    {
        name: "Cauliflower", emoji: "🥦", season: "Rabi", months: [9, 10, 11, 12, 1, 2],
        optimalTemp: { min: 15, max: 25 }, optimalMoisture: { min: 60, max: 80 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 60, max: 90 },
        waterNeed: "High" as const, growthDuration: "90-110 days", yieldRange: [200, 300], marketPrice: "₹1,000-2,000"
    },
    {
        name: "Brinjal (Eggplant)", emoji: "🍆", season: "Zaid", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        optimalTemp: { min: 22, max: 30 }, optimalMoisture: { min: 50, max: 70 }, optimalPH: { min: 5.5, max: 6.8 },
        optimalN: { min: 60, max: 90 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 40, max: 70 },
        waterNeed: "Medium" as const, growthDuration: "120-150 days", yieldRange: [250, 400], marketPrice: "₹1,500-2,500"
    },
    {
        name: "Okra (Bhindi)", emoji: "🪴", season: "Zaid", months: [2, 3, 4, 5, 6, 7],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 45, max: 65 }, optimalPH: { min: 6.0, max: 6.8 },
        optimalN: { min: 50, max: 80 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 40, max: 60 },
        waterNeed: "Medium" as const, growthDuration: "90-100 days", yieldRange: [100, 150], marketPrice: "₹2,000-3,000"
    },
    {
        name: "Carrot", emoji: "🥕", season: "Rabi", months: [9, 10, 11, 12, 1],
        optimalTemp: { min: 15, max: 20 }, optimalMoisture: { min: 50, max: 75 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 40, max: 60 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 60, max: 100 },
        waterNeed: "Medium" as const, growthDuration: "90-110 days", yieldRange: [200, 300], marketPrice: "₹1,200-2,000"
    },
    {
        name: "Garlic", emoji: "🧄", season: "Rabi", months: [10, 11, 12, 1, 2],
        optimalTemp: { min: 13, max: 24 }, optimalMoisture: { min: 40, max: 60 }, optimalPH: { min: 6.0, max: 7.5 },
        optimalN: { min: 60, max: 90 }, optimalP: { min: 40, max: 70 }, optimalK: { min: 60, max: 90 },
        waterNeed: "Medium" as const, growthDuration: "130-150 days", yieldRange: [80, 120], marketPrice: "₹4,000-8,000"
    },

    // --- SPICES & CONDIMENTS ---
    {
        name: "Turmeric", emoji: "🫚", season: "Kharif", months: [5, 6, 7],
        optimalTemp: { min: 20, max: 30 }, optimalMoisture: { min: 60, max: 80 }, optimalPH: { min: 5.5, max: 6.5 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 60, max: 90 },
        waterNeed: "High" as const, growthDuration: "240-270 days", yieldRange: [200, 250], marketPrice: "₹7,000-9,000"
    },
    {
        name: "Ginger", emoji: "🫚", season: "Kharif", months: [4, 5, 6],
        optimalTemp: { min: 25, max: 32 }, optimalMoisture: { min: 60, max: 80 }, optimalPH: { min: 6.0, max: 6.5 },
        optimalN: { min: 60, max: 100 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 60, max: 80 },
        waterNeed: "High" as const, growthDuration: "210-240 days", yieldRange: [150, 200], marketPrice: "₹4,000-6,000"
    },
    {
        name: "Chilli", emoji: "🌶️", season: "Kharif", months: [6, 7, 8, 9],
        optimalTemp: { min: 20, max: 30 }, optimalMoisture: { min: 45, max: 65 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 70, max: 100 }, optimalP: { min: 40, max: 60 }, optimalK: { min: 40, max: 70 },
        waterNeed: "Medium" as const, growthDuration: "140-160 days", yieldRange: [15, 25], marketPrice: "₹15,000-20,000" // Dry
    },
    {
        name: "Coriander", emoji: "🌿", season: "Rabi", months: [10, 11, 12],
        optimalTemp: { min: 15, max: 25 }, optimalMoisture: { min: 35, max: 55 }, optimalPH: { min: 6.0, max: 8.0 },
        optimalN: { min: 30, max: 50 }, optimalP: { min: 20, max: 40 }, optimalK: { min: 20, max: 40 },
        waterNeed: "Low" as const, growthDuration: "90-110 days", yieldRange: [10, 15], marketPrice: "₹6,000-8,000"
    },
    {
        name: "Cumin (Jeera)", emoji: "🌱", season: "Rabi", months: [10, 11, 12],
        optimalTemp: { min: 10, max: 25 }, optimalMoisture: { min: 25, max: 45 }, optimalPH: { min: 7.0, max: 8.5 },
        optimalN: { min: 20, max: 40 }, optimalP: { min: 20, max: 30 }, optimalK: { min: 15, max: 30 },
        waterNeed: "Low" as const, growthDuration: "100-120 days", yieldRange: [5, 8], marketPrice: "₹25,000-30,000"
    },

    // --- FRUITS ---
    {
        name: "Banana", emoji: "🍌", season: "Zaid", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        optimalTemp: { min: 20, max: 35 }, optimalMoisture: { min: 65, max: 85 }, optimalPH: { min: 6.5, max: 7.5 },
        optimalN: { min: 120, max: 180 }, optimalP: { min: 40, max: 80 }, optimalK: { min: 150, max: 220 },
        waterNeed: "High" as const, growthDuration: "12-14 months", yieldRange: [400, 600], marketPrice: "₹1,000-1,500"
    },
    {
        name: "Mango", emoji: "🥭", season: "Zaid", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Trees Planted anytime
        optimalTemp: { min: 24, max: 30 }, optimalMoisture: { min: 40, max: 60 }, optimalPH: { min: 5.5, max: 7.5 },
        optimalN: { min: 60, max: 100 }, optimalP: { min: 30, max: 50 }, optimalK: { min: 50, max: 80 },
        waterNeed: "Medium" as const, growthDuration: "Perennial", yieldRange: [80, 120], marketPrice: "₹4,000-8,000"
    },
    {
        name: "Papaya", emoji: "🍈", season: "Zaid", months: [2, 3, 6, 7, 8, 9, 10],
        optimalTemp: { min: 22, max: 30 }, optimalMoisture: { min: 50, max: 70 }, optimalPH: { min: 6.0, max: 6.5 },
        optimalN: { min: 80, max: 120 }, optimalP: { min: 40, max: 80 }, optimalK: { min: 100, max: 150 },
        waterNeed: "Medium" as const, growthDuration: "9-12 months", yieldRange: [300, 500], marketPrice: "₹1,500-2,500"
    },
    {
        name: "Watermelon", emoji: "🍉", season: "Zaid", months: [1, 2, 3],
        optimalTemp: { min: 25, max: 35 }, optimalMoisture: { min: 45, max: 65 }, optimalPH: { min: 6.0, max: 7.0 },
        optimalN: { min: 50, max: 80 }, optimalP: { min: 30, max: 60 }, optimalK: { min: 50, max: 80 },
        waterNeed: "Medium" as const, growthDuration: "80-100 days", yieldRange: [300, 450], marketPrice: "₹800-1,200"
    }
];

function parseVal(val: any, fallback: number): number {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string") {
        const num = parseFloat(val);
        if (!isNaN(num)) return num;
    }
    return fallback;
}

function rangeScore(value: any, optimal: { min: number; max: number }): number {
    const num = parseVal(value, (optimal.min + optimal.max) / 2);
    if (num >= optimal.min && num <= optimal.max) return 100;
    const mid = (optimal.min + optimal.max) / 2;
    const range = Math.max(1, optimal.max - optimal.min);
    const dist = Math.abs(num - mid);
    return Math.max(0, Math.round(100 - (dist / range) * 80));
}

export function generateCropRecommendations(
    sensor: SensorReading | null,
    weather: WeatherData | null
): CropRecommendation[] {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const tempNum = parseVal(weather?.current.temp ?? sensor?.temperature, 26);
    const humidityNum = parseVal(weather?.current.humidity ?? sensor?.humidity, 60);

    const moistureVal = sensor ? parseVal(sensor.moisture, 55) : 55;
    const phVal = sensor ? parseVal(sensor.soilPH, 6.5) : 6.5;

    const scored = CROP_DATABASE.map((crop) => {
        // Season match
        const inSeason = crop.months.includes(currentMonth);
        const seasonBonus = inSeason ? 20 : -30;

        // Soil match scores
        const moistureScore = rangeScore(moistureVal, crop.optimalMoisture);
        const phScore = rangeScore(phVal, crop.optimalPH);
        const nScore = rangeScore(sensor?.nitrogen, crop.optimalN);
        const pScore = rangeScore(sensor?.phosphorus, crop.optimalP);
        const kScore = rangeScore(sensor?.potassium, crop.optimalK);
        const soilMatch = Math.round((moistureScore + phScore + nScore + pScore + kScore) / 5);

        // Climate match
        const tempScore = rangeScore(tempNum, crop.optimalTemp);
        const climateMatch = Math.round(tempScore);

        // Overall confidence
        const rawConfidence = soilMatch * 0.4 + climateMatch * 0.3 + seasonBonus + (inSeason ? 10 : 0);
        const confidence = Math.max(5, Math.min(98, Math.round(rawConfidence)));

        // Generate reasons
        const reasons: string[] = [];
        if (inSeason) reasons.push(`✅ In season (${crop.season}) — ideal planting time`);
        if (moistureScore > 70) reasons.push(`💧 Soil moisture ${moistureVal}% matches ${crop.name} needs`);
        if (phScore > 70) reasons.push(`🧪 pH ${phVal} is within optimal range (${crop.optimalPH.min}-${crop.optimalPH.max})`);
        if (tempScore > 70) reasons.push(`🌡️ Temperature ${tempNum}°C suits ${crop.name} (${crop.optimalTemp.min}-${crop.optimalTemp.max}°C)`);
        if (nScore > 70 && pScore > 70 && kScore > 70) reasons.push(`🌱 NPK levels match crop requirements`);
        if (reasons.length === 0) reasons.push(`Based on partial soil & climate match`);

        // Generate risks
        const risks: string[] = [];
        if (!inSeason) risks.push(`⚠️ Not in optimal season (best: ${crop.season})`);
        if (moistureScore < 50) risks.push(`💧 Soil moisture ${moistureVal}% is outside ideal range`);
        if (phScore < 50) risks.push(`🧪 pH ${phVal} needs adjustment for this crop`);
        if (tempScore < 50) risks.push(`🌡️ Current temperature ${tempNum}°C is not ideal`);
        if (humidityNum > 85) risks.push(`💦 High humidity (${humidityNum}%) may increase disease risk`);

        // Yield prediction based on conditions
        const yieldFactor = confidence / 100;
        const yieldLow = Math.round(crop.yieldRange[0] * yieldFactor * 0.9);
        const yieldHigh = Math.round(crop.yieldRange[1] * yieldFactor * 1.1);
        const yieldUnit = crop.yieldRange[1] > 100 ? "q/ha" : "q/ha";

        return {
            name: crop.name,
            emoji: crop.emoji,
            confidence,
            yieldPrediction: `${yieldLow}-${yieldHigh} ${yieldUnit}`,
            season: crop.season,
            waterNeed: crop.waterNeed,
            growthDuration: crop.growthDuration,
            marketPrice: crop.marketPrice,
            reasons,
            risks,
            soilMatch,
            climateMatch,
        };
    });

    // Sort by confidence descending
    return scored.sort((a, b) => b.confidence - a.confidence);
}

// Get current Indian agricultural season
export function getCurrentSeason(): { name: string; emoji: string; desc: string } {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10) return { name: "Kharif", emoji: "🌧️", desc: "Monsoon season crops (June-October)" };
    if (month >= 11 || month <= 3) return { name: "Rabi", emoji: "❄️", desc: "Winter season crops (November-March)" };
    return { name: "Zaid", emoji: "☀️", desc: "Summer season crops (April-June)" };
}
