// Live Google Apps Script Sensor Integration
// Fetches real-time sensor data sent by Raspberry Pi to Google Sheets via Apps Script Web App

import { type SensorReading, IOT_CONFIG } from "./iotConfig";

export type GoogleSheetSensorRecord = {
    timestamp: any;
    temperature: any;
    humidity: any;
    ph: any;
    soilMoisture: any;
    soilCondition: any;
};

// Parse timestamp formats: DD/MM/YYYY HH:mm:ss, YYYY-MM-DD HH:mm:ss, ISO strings, Epoch numbers
export function parseTimestamp(ts: any): number | null {
    if (ts === null || ts === undefined || ts === "") return null;

    if (typeof ts === "number") {
        return ts < 10000000000 ? ts * 1000 : ts;
    }

    if (typeof ts === "string") {
        const trimmed = ts.trim();
        if (!trimmed) return null;

        // Matches DD/MM/YYYY HH:mm:ss or DD-MM-YYYY HH:mm:ss
        const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (ddmmyyyy) {
            const [, day, month, year, hours, minutes, seconds] = ddmmyyyy;
            const d = new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hours, 10),
                parseInt(minutes, 10),
                parseInt(seconds, 10)
            );
            return d.getTime();
        }

        // Matches YYYY-MM-DD HH:mm:ss
        const yyyymmdd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})[,\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (yyyymmdd) {
            const [, year, month, day, hours, minutes, seconds] = yyyymmdd;
            return new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hours, 10),
                parseInt(minutes, 10),
                parseInt(seconds, 10)
            ).getTime();
        }

        const parsed = Date.parse(trimmed);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }

    return null;
}

// Extract latest sensor row/object from Google Apps Script response
export function extractLatestRecord(json: any): GoogleSheetSensorRecord | null {
    if (!json) return null;

    let target = json;
    if (json.data !== undefined) {
        target = json.data;
    }

    if (Array.isArray(target)) {
        if (target.length === 0) return null;
        target = target[target.length - 1];
    }

    if (Array.isArray(target)) {
        return {
            timestamp: target[0],
            temperature: target[1],
            humidity: target[2],
            ph: target[3],
            soilMoisture: target[4],
            soilCondition: target[5],
        };
    }

    if (typeof target === "object" && target !== null) {
        return {
            timestamp: target.timestamp ?? target.Timestamp ?? target.time ?? target.Date,
            temperature: target.temperature ?? target.Temperature ?? target.temp,
            humidity: target.humidity ?? target.Humidity,
            ph: target.ph ?? target.pH ?? target.PH ?? target.soilPH ?? target.soilPh,
            soilMoisture: target.soilMoisture ?? target.SoilMoisture ?? target.moisture ?? target.Moisture,
            soilCondition: target.soilCondition ?? target.SoilCondition ?? target.condition ?? target.Condition,
        };
    }

    return null;
}

// Main fetch function that polls Google Apps Script Web App.
// Returns null if request fails or invalid record received.
export async function fetchRealSensorData(): Promise<SensorReading | null> {
    try {
        const res = await fetch(IOT_CONFIG.GOOGLE_APPS_SCRIPT_URL, { redirect: "follow" });
        if (!res.ok) return null;
        const json = await res.json();
        const record = extractLatestRecord(json);
        if (!record) return null;

        const parseNum = (val: any): number | "-" => {
            if (val === null || val === undefined || val === "" || val === "-") return "-";
            const num = typeof val === "number" ? val : parseFloat(String(val));
            return isNaN(num) ? "-" : num;
        };

        const temp = parseNum(record.temperature);
        const hum = parseNum(record.humidity);
        const ph = parseNum(record.ph);
        const moisture = parseNum(record.soilMoisture);
        const condition = typeof record.soilCondition === "string" && record.soilCondition.trim() !== "" ? record.soilCondition.trim() : "-";
        const recordTime = parseTimestamp(record.timestamp) ?? Date.now();

        return {
            moisture,
            temperature: temp,
            humidity: hum,
            soilPH: ph,
            soilCondition: condition,
            soilTemp: "-",
            nitrogen: "-",
            phosphorus: "-",
            potassium: "-",
            farmHealth: typeof moisture === "number" && typeof temp === "number" ? Math.round(Math.min(100, Math.max(0, moisture * 0.5 + temp * 1.5))) : "-",
            lightIntensity: 0,
            timestamp: recordTime,
        };
    } catch {
        return null;
    }
}

export function getSimulatedSensorData(): SensorReading | null {
    return null;
}
