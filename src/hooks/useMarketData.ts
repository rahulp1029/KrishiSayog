// Real-time market data hook
// Updates every 30 seconds with small price movements

import { useState, useEffect, useRef, useCallback } from "react";
import { IOT_CONFIG, type MarketPrice } from "../services/iotConfig";
import { getMarketPrices, getHistoricalPrices } from "../services/marketService";

export function useMarketData() {
    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [history, setHistory] = useState<Array<{ month: string; rice: number; wheat: number; cotton: number }>>([]);
    const [isLive, setIsLive] = useState(true);
    const intervalRef = useRef<number | null>(null);

    const fetchData = useCallback(() => {
        const data = getMarketPrices();
        setPrices(data);
        setIsLive(true);
    }, []);

    useEffect(() => {
        fetchData();
        setHistory(getHistoricalPrices());
        intervalRef.current = window.setInterval(fetchData, IOT_CONFIG.MARKET_POLL_INTERVAL);
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [fetchData]);

    // Best crop to sell (highest positive change %)
    const bestCrop = prices.length
        ? prices.reduce((best, p) => (p.changePercent > best.changePercent ? p : best), prices[0])
        : null;

    return { prices, history, isLive, bestCrop, lastUpdated: prices[0]?.timestamp ?? null };
}
