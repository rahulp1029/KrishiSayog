// Open-Meteo Weather Service — 100% FREE, NO API KEY NEEDED
// Provides real-time weather data for any city in the world

import { type WeatherData } from "./iotConfig";

const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// WMO Weather codes → description + emoji
const WMO_CODES: Record<number, { desc: string; icon: string }> = {
    0: { desc: "Clear sky", icon: "☀️" },
    1: { desc: "Mainly clear", icon: "🌤️" },
    2: { desc: "Partly cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Foggy", icon: "🌫️" },
    48: { desc: "Freezing fog", icon: "🌫️" },
    51: { desc: "Light drizzle", icon: "🌦️" },
    53: { desc: "Moderate drizzle", icon: "🌦️" },
    55: { desc: "Dense drizzle", icon: "🌧️" },
    61: { desc: "Slight rain", icon: "🌦️" },
    63: { desc: "Moderate rain", icon: "🌧️" },
    65: { desc: "Heavy rain", icon: "🌧️" },
    71: { desc: "Slight snow", icon: "🌨️" },
    73: { desc: "Moderate snow", icon: "🌨️" },
    75: { desc: "Heavy snow", icon: "❄️" },
    77: { desc: "Snow grains", icon: "❄️" },
    80: { desc: "Slight showers", icon: "🌦️" },
    81: { desc: "Moderate showers", icon: "🌧️" },
    82: { desc: "Heavy showers", icon: "🌧️" },
    85: { desc: "Light snow showers", icon: "🌨️" },
    86: { desc: "Heavy snow showers", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⛈️" },
    96: { desc: "Thunderstorm with hail", icon: "⛈️" },
    99: { desc: "Thunderstorm with heavy hail", icon: "⛈️" },
};

function getWeatherInfo(code: number) {
    return WMO_CODES[code] || { desc: "Unknown", icon: "🌤️" };
}

function getDayName(dateStr: string, index: number): string {
    if (index === 0) return "Today";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(dateStr);
    return days[d.getDay()];
}

function formatHour(timeStr: string): string {
    const hour = parseInt(timeStr.split("T")[1]?.split(":")[0] || "0");
    if (hour === 0) return "12AM";
    if (hour === 12) return "12PM";
    return hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
}

// Search cities using Open-Meteo Geocoding API
export type GeoCity = {
    name: string;
    admin1: string; // state/province
    country: string;
    latitude: number;
    longitude: number;
    displayName: string;
};

export async function searchCities(query: string): Promise<GeoCity[]> {
    if (!query || query.length < 2) return [];

    try {
        const res = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
        if (!res.ok) return [];
        const data = await res.json();

        if (!data.results) return [];

        return data.results.map((r: any) => ({
            name: r.name,
            admin1: r.admin1 || "",
            country: r.country || "",
            latitude: r.latitude,
            longitude: r.longitude,
            displayName: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
        }));
    } catch {
        return [];
    }
}

// Reverse geocode from lat/lon to get city/state
export async function reverseGeocode(lat: number, lon: number): Promise<GeoCity | null> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
            headers: {
                'Accept-Language': 'en'
            }
        });

        if (!res.ok) return null;

        const data = await res.json();
        const address = data.address || {};

        const city = address.city || address.town || address.village || address.county || "Unknown Location";
        const state = address.state || "";
        const country = address.country || "";

        return {
            name: city,
            admin1: state,
            country: country,
            latitude: lat,
            longitude: lon,
            displayName: [city, state, country].filter(Boolean).join(", ")
        };
    } catch (e) {
        console.warn("Reverse geocoding failed", e);
        return null;
    }
}

// Fetch real weather from Open-Meteo
export async function fetchWeatherForLocation(
    lat: number,
    lon: number,
    locationName: string
): Promise<WeatherData> {
    try {
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lon.toString(),
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "surface_pressure",
                "cloud_cover",
            ].join(","),
            hourly: [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation_probability",
                "weather_code",
            ].join(","),
            daily: [
                "temperature_2m_max",
                "temperature_2m_min",
                "weather_code",
                "precipitation_probability_max",
                "relative_humidity_2m_mean" as string,
            ].join(","),
            timezone: "auto",
            forecast_days: "7",
        });

        const res = await fetch(`${WEATHER_API}?${params}`);
        if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
        const data = await res.json();

        const currentWeather = getWeatherInfo(data.current.weather_code);

        // Process hourly — next 24 hours (every 3 hours = 8 points)
        const currentHourIndex = new Date().getHours();
        const hourlyData = [];
        for (let i = currentHourIndex; i < Math.min(currentHourIndex + 24, data.hourly.time.length); i += 3) {
            const wInfo = getWeatherInfo(data.hourly.weather_code[i]);
            hourlyData.push({
                time: formatHour(data.hourly.time[i]),
                temp: Math.round(data.hourly.temperature_2m[i] * 10) / 10,
                humidity: data.hourly.relative_humidity_2m[i],
                pop: data.hourly.precipitation_probability?.[i] || 0,
                description: wInfo.desc,
                icon: wInfo.icon,
            });
        }

        // Process daily
        const dailyData = data.daily.time.map((dateStr: string, i: number) => {
            const wInfo = getWeatherInfo(data.daily.weather_code[i]);
            return {
                day: getDayName(dateStr, i),
                tempMax: Math.round(data.daily.temperature_2m_max[i] * 10) / 10,
                tempMin: Math.round(data.daily.temperature_2m_min[i] * 10) / 10,
                humidity: data.daily.relative_humidity_2m_mean?.[i] || 60,
                pop: data.daily.precipitation_probability_max?.[i] || 0,
                description: wInfo.desc,
                icon: wInfo.icon,
                main: wInfo.desc,
            };
        });

        return {
            current: {
                temp: Math.round(data.current.temperature_2m * 10) / 10,
                feelsLike: Math.round(data.current.apparent_temperature * 10) / 10,
                humidity: data.current.relative_humidity_2m,
                windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
                windDeg: data.current.wind_direction_10m,
                pressure: Math.round(data.current.surface_pressure),
                visibility: 10,
                uvi: 0,
                clouds: data.current.cloud_cover || 0,
                description: currentWeather.desc,
                icon: currentWeather.icon,
                main: currentWeather.desc,
            },
            hourly: hourlyData,
            daily: dailyData,
            location: locationName,
            fetchedAt: Date.now(),
        };
    } catch (error) {
        console.error("Open-Meteo fetch failed:", error);
        throw error;
    }
}

// Default fetch using configured location
export async function fetchWeather(): Promise<WeatherData> {
    const lat = parseFloat(import.meta.env.VITE_LOCATION_LAT || "19.9975");
    const lon = parseFloat(import.meta.env.VITE_LOCATION_LON || "73.7898");
    return fetchWeatherForLocation(lat, lon, "Nashik, Maharashtra");
}
