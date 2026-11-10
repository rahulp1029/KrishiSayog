// KrishiSayog IoT Configuration

export const IOT_CONFIG = {
    // "real" = fetch live sensor data from Google Apps Script endpoint
    IOT_MODE: (import.meta.env.VITE_IOT_MODE as string) || "real",

    // Google Apps Script Web App Endpoint
    GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzSl-ZxQILcEeUddJ2ib55LYA4Bn0_KDRLn_bkBZloW1T7o0h0MnYaPIUCqXEL68CBg/exec",

    // ESP32 endpoint — fallback if connected
    ESP32_URL: (import.meta.env.VITE_ESP32_URL as string) || "http://192.168.1.100",

    // Sensor polling interval (1 second)
    SENSOR_POLL_INTERVAL: 1000,    // 1 second polling interval
    WEATHER_POLL_INTERVAL: 600000, // 10 minutes for weather
    MARKET_POLL_INTERVAL: 30000,   // 30 seconds for market prices

    // Location (default: Nashik, Maharashtra)
    LOCATION: {
        lat: parseFloat(import.meta.env.VITE_LOCATION_LAT || "19.9975"),
        lon: parseFloat(import.meta.env.VITE_LOCATION_LON || "73.7898"),
        name: "Nashik, Maharashtra",
    },

    // OpenWeatherMap
    OPENWEATHER_API_KEY: (import.meta.env.VITE_OPENWEATHER_API_KEY as string) || "",
};

export type SensorReading = {
    moisture: number | string;      // % or "-"
    temperature: number | string;   // °C or "-"
    humidity: number | string;      // % or "-"
    soilPH: number | string;        // pH or "-"
    soilCondition?: string;         // DRY | SEMI-MOIST | WET | "-"
    soilTemp?: number | string;     // °C or "-"
    nitrogen?: number | string;     // mg/kg or "-"
    phosphorus?: number | string;   // mg/kg or "-"
    potassium?: number | string;    // mg/kg or "-"
    farmHealth: number | string;    // score or "-"
    lightIntensity: number;         // lux
    timestamp: number;             // Unix ms
};

export type WeatherData = {
    current: {
        temp: number;
        feelsLike: number;
        humidity: number;
        windSpeed: number;
        windDeg: number;
        pressure: number;
        visibility: number;
        uvi: number;
        clouds: number;
        description: string;
        icon: string;
        main: string;
    };
    hourly: Array<{
        time: string;
        temp: number;
        humidity: number;
        pop: number; // probability of precipitation
        description: string;
        icon: string;
    }>;
    daily: Array<{
        day: string;
        tempMax: number;
        tempMin: number;
        humidity: number;
        pop: number;
        description: string;
        icon: string;
        main: string;
    }>;
    location: string;
    fetchedAt: number;
};

export type MarketPrice = {
    crop: string;
    price: number;
    change: number;
    changePercent: number;
    trend: "up" | "down" | "stable";
    mandi: string;
    timestamp: number;
};
