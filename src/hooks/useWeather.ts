// Real-time weather hook with city/state selector
// Uses Open-Meteo API — 100% free, no API key

import { useState, useEffect, useRef, useCallback } from "react";
import { type WeatherData } from "../services/iotConfig";
import { fetchWeatherForLocation, searchCities, reverseGeocode, type GeoCity } from "../services/weatherService";

export function useWeather() {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<GeoCity>({
        name: "Nashik",
        admin1: "Maharashtra",
        country: "India",
        latitude: 19.9975,
        longitude: 73.7898,
        displayName: "Nashik, Maharashtra, India",
    });
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

    // Fetch on mount and when city changes
    useEffect(() => {
        let mounted = true;

        const initLocation = () => {
            if ("geolocation" in navigator) {
                // Check if we already got permission or if it's default
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const geoCity = await reverseGeocode(latitude, longitude);

                        if (mounted && geoCity) {
                            setSelectedCity(geoCity);
                            // Setting selectedCity triggers the effect to fetch weather
                        } else if (mounted) {
                            // If reverse geocoding fails, fallback to coordinates
                            setSelectedCity({
                                name: "Your Location",
                                admin1: "",
                                country: "",
                                latitude,
                                longitude,
                                displayName: "Current Location"
                            });
                        }
                    },
                    (err) => {
                        console.warn("Geolocation warning:", err.message);
                        if (mounted) {
                            fetchData(selectedCity);
                        }
                    },
                    { timeout: 10000 }
                );
            } else {
                if (mounted) fetchData(selectedCity);
            }
        };

        // Only run geolocation if we're dealing with the default Nashik coordinates
        // This prevents overriding user selection
        if (selectedCity.name === "Nashik" && selectedCity.latitude === 19.9975) {
            initLocation();
        } else {
            fetchData(selectedCity);
        }

        // Auto-refresh every 10 minutes
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
