// Real-time Market Price Simulator
// Generates realistic fluctuating mandi prices with small movements
// Ready for real market API integration later

import { type MarketPrice } from "./iotConfig";

const BASE_PRICES: Record<string, { price: number; mandi: string; volatility: number }> = {
    Rice: { price: 2150, mandi: "Azadpur, Delhi", volatility: 15 },
    Wheat: { price: 2290, mandi: "Vashi, Mumbai", volatility: 12 },
    Cotton: { price: 6550, mandi: "Gultekdi, Pune", volatility: 40 },
    Sugarcane: { price: 3180, mandi: "Koyambedu, Chennai", volatility: 10 },
    Maize: { price: 1975, mandi: "Yeshwanthpur, Bengaluru", volatility: 18 },
    Soybean: { price: 4200, mandi: "Indore, MP", volatility: 25 },
};

// Track cumulative drift per crop for realistic trends
const priceDrift: Record<string, number> = {};

export function getMarketPrices(): MarketPrice[] {
    const now = Date.now();

    return Object.entries(BASE_PRICES).map(([crop, config]) => {
        // Initialize drift
        if (priceDrift[crop] === undefined) priceDrift[crop] = 0;

        // Random walk: small step each call, cumulative for trend
        const step = (Math.random() - 0.48) * config.volatility; // slight upward bias
        priceDrift[crop] = Math.max(-config.price * 0.1, Math.min(config.price * 0.1, priceDrift[crop] + step));

        const price = Math.round(config.price + priceDrift[crop]);
        const change = Math.round(priceDrift[crop]);
        const changePercent = Math.round((change / config.price) * 10000) / 100;
        const trend: "up" | "down" | "stable" =
            changePercent > 0.5 ? "up" : changePercent < -0.5 ? "down" : "stable";

        return {
            crop,
            price,
            change,
            changePercent,
            trend,
            mandi: config.mandi,
            timestamp: now,
        };
    });
}

// Price history for charts (generates last 6 months of data)
export function getHistoricalPrices(): Array<{ month: string; rice: number; wheat: number; cotton: number }> {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const now = new Date();
    const currentMonth = now.getMonth();

    return months.map((m, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12;
        const seasonFactor = Math.sin(((monthIndex - 3) / 12) * 2 * Math.PI) * 0.05;
        return {
            month: m,
            rice: Math.round(2050 + i * 20 + seasonFactor * 2050 + (Math.random() - 0.5) * 30),
            wheat: Math.round(2200 + i * 15 + seasonFactor * 2200 + (Math.random() - 0.5) * 25),
            cotton: Math.round(6300 + i * 50 + seasonFactor * 6300 + (Math.random() - 0.5) * 80),
        };
    });
}
