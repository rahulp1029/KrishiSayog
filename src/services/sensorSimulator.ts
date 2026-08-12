// Realistic IoT Sensor Simulator
// Generates time-of-day-aware sensor data with natural fluctuations
// Replace with real ESP32 REST calls when hardware is connected

import { type SensorReading } from "./iotConfig";

// Helper: time-of-day factor (0-1) based on current hour
function diurnalCycle(offset = 0): number {
    const hour = new Date().getHours() + offset;
    // Peak at 2pm (14:00), trough at 4am
    return 0.5 + 0.5 * Math.sin(((hour - 8) / 24) * 2 * Math.PI);
}

// Helper: small random noise
function noise(amplitude = 1): number {
    return (Math.random() - 0.5) * 2 * amplitude;
}

// Helper: clamp a value within a range
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// Persistent state for smooth transitions
let prevReading: SensorReading | null = null;

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function getSimulatedSensorData(): SensorReading {
    const now = Date.now();
    const dayCycle = diurnalCycle();
    const seconds = now / 1000;

    // Soil Moisture: drops during day (evaporation), rises at night
    // Range: 35-75%
    const baseMoisture = 65 - dayCycle * 25;
    const moisture = clamp(baseMoisture + noise(3) + Math.sin(seconds / 60) * 2, 30, 80);

    // Air Temperature: follows diurnal cycle, 18-38°C
    const baseTemp = 22 + dayCycle * 14;
    const temperature = clamp(baseTemp + noise(1.5), 15, 42);

    // Humidity: inverse of temperature roughly, 40-90%
    const baseHumidity = 80 - dayCycle * 30;
    const humidity = clamp(baseHumidity + noise(3), 35, 95);

    // Soil Temperature: lags air temp slightly, lower amplitude
    const baseSoilTemp = 20 + dayCycle * 10;
    const soilTemp = clamp(baseSoilTemp + noise(0.8), 15, 35);

    // Soil pH: relatively stable, slow drift, 5.8-7.2
    const basePH = 6.5 + Math.sin(seconds / 300) * 0.3;
    const soilPH = clamp(basePH + noise(0.1), 5.5, 7.5);

    // NPK: slow changes over hours
    const nitrogen = clamp(70 + Math.sin(seconds / 200) * 8 + noise(2), 40, 100);
    const phosphorus = clamp(55 + Math.sin(seconds / 250) * 6 + noise(2), 30, 85);
    const potassium = clamp(82 + Math.sin(seconds / 180) * 5 + noise(2), 50, 100);

    // Light Intensity: follows solar cycle closely
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    const baseLux = isNight ? 10 : 2000 + dayCycle * 50000;
    const lightIntensity = clamp(baseLux + noise(isNight ? 5 : 500), 0, 80000);

    // Farm Health Score: derived from other readings
    const moistureScore = moisture >= 45 && moisture <= 70 ? 25 : moisture >= 35 && moisture <= 80 ? 15 : 5;
    const phScore = soilPH >= 6.0 && soilPH <= 7.0 ? 25 : soilPH >= 5.5 && soilPH <= 7.5 ? 15 : 5;
    const tempScore = temperature >= 20 && temperature <= 32 ? 25 : temperature >= 15 && temperature <= 38 ? 15 : 5;
    const npkScore = (nitrogen + phosphorus + potassium) / 3 > 60 ? 25 : 15;
    const farmHealth = clamp(moistureScore + phScore + tempScore + npkScore + noise(2), 0, 100);

    const raw: SensorReading = {
        moisture: Math.round(moisture * 10) / 10,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        soilPH: Math.round(soilPH * 100) / 100,
        soilTemp: Math.round(soilTemp * 10) / 10,
        nitrogen: Math.round(nitrogen),
        phosphorus: Math.round(phosphorus),
        potassium: Math.round(potassium),
        farmHealth: Math.round(farmHealth),
        lightIntensity: Math.round(lightIntensity),
        timestamp: now,
    };

    // Smooth transition from previous reading (prevent jumps)
    if (prevReading) {
        const smooth: SensorReading = {
            moisture: Math.round(lerp(prevReading.moisture, raw.moisture, 0.3) * 10) / 10,
            temperature: Math.round(lerp(prevReading.temperature, raw.temperature, 0.3) * 10) / 10,
            humidity: Math.round(lerp(prevReading.humidity, raw.humidity, 0.3) * 10) / 10,
            soilPH: Math.round(lerp(prevReading.soilPH, raw.soilPH, 0.3) * 100) / 100,
            soilTemp: Math.round(lerp(prevReading.soilTemp, raw.soilTemp, 0.3) * 10) / 10,
            nitrogen: Math.round(lerp(prevReading.nitrogen, raw.nitrogen, 0.3)),
            phosphorus: Math.round(lerp(prevReading.phosphorus, raw.phosphorus, 0.3)),
            potassium: Math.round(lerp(prevReading.potassium, raw.potassium, 0.3)),
            farmHealth: Math.round(lerp(prevReading.farmHealth, raw.farmHealth, 0.3)),
            lightIntensity: Math.round(lerp(prevReading.lightIntensity, raw.lightIntensity, 0.3)),
            timestamp: now,
        };
        prevReading = smooth;
        return smooth;
    }

    prevReading = raw;
    return raw;
}

// Fetch from real ESP32
export async function fetchRealSensorData(espUrl: string): Promise<SensorReading> {
    const res = await fetch(`${espUrl}/api/sensors`);
    if (!res.ok) throw new Error(`ESP32 error: ${res.status}`);
    const data = await res.json();
    return {
        moisture: data.moisture ?? 0,
        temperature: data.temperature ?? 0,
        humidity: data.humidity ?? 0,
        soilPH: data.ph ?? 6.5,
        soilTemp: data.soil_temp ?? 0,
        nitrogen: data.nitrogen ?? 0,
        phosphorus: data.phosphorus ?? 0,
        potassium: data.potassium ?? 0,
        farmHealth: data.health ?? 0,
        lightIntensity: data.light ?? 0,
        timestamp: Date.now(),
    };
}
