// KrishiSayog IoT Configuration
// Flip IOT_MODE to "real" when ESP32 hardware is connected

export const IOT_CONFIG = {
    // "simulator" = use built-in realistic data simulator
    // "real"      = fetch from ESP32 REST API
    IOT_MODE: (import.meta.env.VITE_IOT_MODE as string) || "simulator",

    // ESP32 endpoint — set when hardware is connected
    ESP32_URL: (import.meta.env.VITE_ESP32_URL as string) || "http://192.168.1.100",

    // Sensor polling interval (ms)
    SENSOR_POLL_INTERVAL: 5000,    // 5 seconds for sensors
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
    moisture: number;      // % (0-100)
    temperature: number;   // °C
    humidity: number;      // %
    soilPH: number;        // 0-14
    soilTemp: number;      // °C
    nitrogen: number;      // mg/kg (0-100)
    phosphorus: number;    // mg/kg (0-100)
    potassium: number;     // mg/kg (0-100)
    farmHealth: number;    // score 0-100
    lightIntensity: number; // lux
    timestamp: number;     // Unix ms
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
