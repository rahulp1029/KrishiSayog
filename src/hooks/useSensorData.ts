// Real-time sensor data hook
// Polls simulator (or real ESP32) every 5 seconds
// Maintains history for charts

import { useState, useEffect, useRef, useCallback } from "react";
import { IOT_CONFIG, type SensorReading } from "../services/iotConfig";
import { getSimulatedSensorData, fetchRealSensorData } from "../services/sensorSimulator";

const MAX_HISTORY = 60; // Keep last 60 readings (~5 min at 5s interval)

export function useSensorData() {
    const [current, setCurrent] = useState<SensorReading | null>(null);
    const [history, setHistory] = useState<SensorReading[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            let reading: SensorReading;

            if (IOT_CONFIG.IOT_MODE === "real") {
                reading = await fetchRealSensorData(IOT_CONFIG.ESP32_URL);
            } else {
                reading = getSimulatedSensorData();
            }

            setCurrent(reading);
            setHistory((prev) => {
                const updated = [...prev, reading];
                return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
            });
            setIsLive(true);
            setError(null);

            // Stream telemetry to Express backend (which auto-saves to MySQL & Firebase)
            try {
                fetch('http://localhost:3001/api/telemetry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moisture: reading.moisture,
                        temperature: reading.temperature,
                        humidity: reading.humidity,
                        waterLevel: 75.0,
                        soilPH: reading.soilPH,
                        nitrogen: reading.nitrogen,
                        phosphorus: reading.phosphorus,
                        potassium: reading.potassium
                    })
                }).catch(() => {});
            } catch (e) {}
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sensor read failed");
            setIsLive(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Start polling
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
            hour12: true,
        }),
        moisture: r.moisture,
        temperature: r.temperature,
        humidity: r.humidity,
        soilPH: r.soilPH,
        soilTemp: r.soilTemp,
        farmHealth: r.farmHealth,
        lightIntensity: Math.round(r.lightIntensity / 1000), // Convert lux to klux for readability
        nitrogen: r.nitrogen,
        phosphorus: r.phosphorus,
        potassium: r.potassium,
    }));

    return {
        current,
        history,
        chartData,
        isLive,
        error,
        lastUpdated: current?.timestamp ?? null,
        mode: IOT_CONFIG.IOT_MODE,
    };
}
