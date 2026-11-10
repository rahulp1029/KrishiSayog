// Real-time weather hook with automatic browser geolocation
// Uses Open-Meteo API — 100% free, no API key needed

import { useState, useEffect, useRef, useCallback } from "react";
import { type WeatherData } from "../types/weather";
import { fetchWeatherForLocation, searchCities, reverseGeocode, type GeoCity } from "../services/weatherService";

const SAVED_CITY_KEY = "krishisayog_detected_city_v1";

function getSavedCity(): GeoCity | null {
    try {
        const stored = localStorage.getItem(SAVED_CITY_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function saveCity(city: GeoCity) {
    try {
        localStorage.setItem(SAVED_CITY_KEY, JSON.stringify(city));
    } catch (e) {
        console.warn("Failed to store city in localStorage:", e);
    }
}

export function useWeather() {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialCity: GeoCity = getSavedCity() || {
        name: "Davanagere",
        admin1: "Karnataka",
        country: "India",
        latitude: 14.4673,
        longitude: 75.9241,
        displayName: "Davanagere, Karnataka, India",
    };

    const [selectedCity, setSelectedCity] = useState<GeoCity>(initialCity);
    const [searchResults, setSearchResults] = useState<GeoCity[]>([]);
    const [searching, setSearching] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const searchDebounce = useRef<number | null>(null);

    const fetchData = useCallback(async (city: GeoCity) => {
        setLoading(true);
        setError(null);
        try {
            const weather = await fetchWeatherForLocation(
                city.latitude,
                city.longitude,
                city.displayName
            );
            setData(weather);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Weather fetch failed");
        } finally {
            setLoading(false);
        }
    }, []);

    // Automatic Browser Geolocation & Reverse Geocoding on initial mount
    useEffect(() => {
        let mounted = true;

        const requestLiveLocation = () => {
            if (typeof window !== "undefined" && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const geoCity = await reverseGeocode(latitude, longitude);

                        if (mounted && geoCity) {
                            setSelectedCity(geoCity);
                            saveCity(geoCity);
                            fetchData(geoCity);
                        } else if (mounted) {
                            const fallbackCity: GeoCity = {
                                name: "Detected Location",
                                admin1: "",
                                country: "India",
                                latitude,
                                longitude,
                                displayName: "Detected Location"
                            };
                            setSelectedCity(fallbackCity);
                            fetchData(fallbackCity);
                        }
                    },
                    (err) => {
                        console.warn("Geolocation permission or timeout warning:", err.message);
                        if (mounted) {
                            fetchData(selectedCity);
                        }
                    },
                    { timeout: 12000, enableHighAccuracy: true }
                );
            } else {
                if (mounted) fetchData(selectedCity);
            }
        };

        // Always attempt live location detection if saved location is default
        if (!getSavedCity()) {
            requestLiveLocation();
        } else {
            fetchData(selectedCity);
        }

        // Auto-refresh weather every 10 minutes
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => fetchData(selectedCity), 600000);

        return () => {
            mounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [selectedCity, fetchData]);

    // Search for cities with debounce
    const searchCity = useCallback((query: string) => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);

        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        searchDebounce.current = window.setTimeout(async () => {
            const results = await searchCities(query);
            setSearchResults(results);
            setSearching(false);
        }, 300);
    }, []);

    const selectCity = useCallback((city: GeoCity) => {
        setSelectedCity(city);
        saveCity(city);
        setSearchResults([]);
    }, []);

    return {
        data,
        loading,
        error,
        selectedCity,
        searchResults,
        searching,
        searchCity,
        selectCity,
        refresh: () => fetchData(selectedCity),
    };
}
