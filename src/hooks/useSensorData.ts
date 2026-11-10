// Live sensor data hook
// Polls Google Apps Script Web App every 1 second
// Always retains and displays the LAST KNOWN valid sensor reading

import { useState, useEffect, useRef, useCallback } from "react";
import { IOT_CONFIG, type SensorReading } from "../services/iotConfig";
import { fetchRealSensorData } from "../services/sensorSimulator";

const MAX_HISTORY = 60; // Keep last 60 readings for live charts

// Initial fallback object for initial render before first successful fetch
const INITIAL_READING: SensorReading = {
    moisture: "-",
    temperature: "-",
    humidity: "-",
    soilPH: "-",
    soilCondition: "-",
    soilTemp: "-",
    nitrogen: "-",
    phosphorus: "-",
    potassium: "-",
    farmHealth: "-",
    lightIntensity: 0,
    timestamp: Date.now(),
};

export function useSensorData() {
    const [current, setCurrent] = useState<SensorReading>(INITIAL_READING);
    const [history, setHistory] = useState<SensorReading[]>([]);
    const [hasReceivedFirstValid, setHasReceivedFirstValid] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const isFetchingRef = useRef(false);

    const fetchData = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            const reading = await fetchRealSensorData();

            // ONLY replace current state if a NEW VALID SENSOR RECORD is successfully received
            if (reading !== null) {
                setCurrent(reading);
                setHasReceivedFirstValid(true);

                setHistory((prev) => {
                    const updated = [...prev, reading];
                    return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
                });

                // Optional: Stream telemetry to Express backend
                try {
                    fetch('http://localhost:3001/api/telemetry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            moisture: reading.moisture,
                            temperature: reading.temperature,
                            humidity: reading.humidity,
                            soilPH: reading.soilPH,
                        })
                    }).catch(() => {});
                } catch {}
            }
            // IF FETCH FAILS OR RETURNS NULL: DO NOT CLEAR STATE, DO NOT REPLACE WITH "-", KEEP DISPLAYING LAST VALUES
        } catch {
            // Keep last valid state on error
        } finally {
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchData();

        // 1-second polling interval
        intervalRef.current = window.setInterval(fetchData, IOT_CONFIG.SENSOR_POLL_INTERVAL);

        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [fetchData]);

    // Format history for Recharts
    const chartData = history.map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        }),
        moisture: typeof r.moisture === "number" ? r.moisture : 0,
        temperature: typeof r.temperature === "number" ? r.temperature : 0,
        humidity: typeof r.humidity === "number" ? r.humidity : 0,
        soilPH: typeof r.soilPH === "number" ? r.soilPH : 0,
        soilTemp: typeof r.soilTemp === "number" ? r.soilTemp : 0,
        farmHealth: typeof r.farmHealth === "number" ? r.farmHealth : 0,
        lightIntensity: Math.round(r.lightIntensity / 1000),
        nitrogen: typeof r.nitrogen === "number" ? r.nitrogen : 0,
        phosphorus: typeof r.phosphorus === "number" ? r.phosphorus : 0,
        potassium: typeof r.potassium === "number" ? r.potassium : 0,
    }));

    return {
        current,
        history,
        chartData,
        isLive: true, // Always active live display
        error: null,
        lastUpdated: current?.timestamp ?? null,
        hasReceivedFirstValid,
        mode: "Google Sheets",
    };
}
