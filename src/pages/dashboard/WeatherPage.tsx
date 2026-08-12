import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Cloud, CloudRain, Wind, Droplets, Thermometer, Eye, Search, MapPin, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export default function WeatherPage() {
    const { data, loading, error, selectedCity, searchResults, searching, searchCity, selectCity } = useWeather();
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchCity(query);
        setShowDropdown(true);
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64 page-enter">
                <div className="text-center">
                    <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-medium">Fetching real-time weather...</p>
                    <p className="text-xs text-muted-foreground mt-1">Connecting to Open-Meteo API</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter">
            {/* Header + City Search */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading">🌤 Weather Forecast</h1>
                        <p className="text-muted-foreground text-sm">
                            Real-time data for <strong>{selectedCity.displayName}</strong>
                        </p>
                    </div>
                    <LiveIndicator isLive={!!data} lastUpdated={data?.fetchedAt ?? null} label="Live API" />
                </div>

                {/* City Search */}
                <div ref={dropdownRef} className="relative max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search city or state... (e.g. Mumbai, Delhi, Bangalore)"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                            className="pl-10 pr-10"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
                            {searchResults.map((city, i) => (
                                <button
                                    key={`${city.latitude}-${city.longitude}-${i}`}
                                    onClick={() => {
                                        selectCity(city);
                                        setSearchQuery("");
                                        setShowDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors flex items-center gap-3 border-b last:border-0"
                                >
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">{city.name}</p>
                                        <p className="text-xs text-muted-foreground">{city.admin1}{city.admin1 && city.country ? ", " : ""}{city.country}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-4 pb-4 text-center text-sm text-destructive">
                        ⚠️ {error} — Retrying...
                    </CardContent>
                </Card>
            )}

            {data && (
                <>
                    {/* Current weather */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <Card className="card-shadow overflow-hidden">
                            <div className="hero-gradient p-6 text-primary-foreground">
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-6xl" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
                                            {data.current.icon}
                                        </span>
                                        <div>
                                            <p className="text-sm text-primary-foreground/70 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {data.location}
                                            </p>
                                            <p className="text-5xl font-bold font-heading">
                                                <AnimatedNumber value={data.current.temp} decimals={1} suffix="°C" />
                                            </p>
                                            <p className="text-lg capitalize">{data.current.description}</p>
                                            <p className="text-sm text-primary-foreground/70 mt-1">
                                                Feels like <AnimatedNumber value={data.current.feelsLike} decimals={1} suffix="°C" />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 mt-4 md:mt-0">
                                        <div className="text-center">
                                            <Droplets className="h-5 w-5 mx-auto mb-1 text-primary-foreground/70" />
                                            <p className="text-sm text-primary-foreground/70">Humidity</p>
                                            <p className="font-semibold"><AnimatedNumber value={data.current.humidity} suffix="%" /></p>
                                        </div>
                                        <div className="text-center">
                                            <Wind className="h-5 w-5 mx-auto mb-1 text-primary-foreground/70" />
                                            <p className="text-sm text-primary-foreground/70">Wind</p>
                                            <p className="font-semibold"><AnimatedNumber value={data.current.windSpeed} decimals={1} suffix=" km/h" /></p>
                                        </div>
                                        <div className="text-center">
                                            <Thermometer className="h-5 w-5 mx-auto mb-1 text-primary-foreground/70" />
                                            <p className="text-sm text-primary-foreground/70">Pressure</p>
                                            <p className="font-semibold"><AnimatedNumber value={data.current.pressure} suffix=" hPa" /></p>
                                        </div>
                                        <div className="text-center">
                                            <Eye className="h-5 w-5 mx-auto mb-1 text-primary-foreground/70" />
                                            <p className="text-sm text-primary-foreground/70">Clouds</p>
                                            <p className="font-semibold"><AnimatedNumber value={data.current.clouds} suffix="%" /></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* 7-day forecast */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {data.daily.map((day, i) => (
                            <motion.div
                                key={day.day + i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                            >
                                <Card className={`card-shadow text-center hover:card-shadow-hover transition-all duration-300 ${i === 0 ? "border-primary border-2" : ""}`}>
                                    <CardContent className="pt-4 pb-4">
                                        <p className="text-sm font-semibold mb-2">{day.day}</p>
                                        <span className="text-3xl">{day.icon}</span>
                                        <p className="text-lg font-bold mt-2">{Math.round(day.tempMax)}°</p>
                                        <p className="text-xs text-muted-foreground">{Math.round(day.tempMin)}°</p>
                                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                            <CloudRain className="h-3 w-3" />
                                            {day.pop}%
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Hourly charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="card-shadow">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Thermometer className="h-4 w-4 text-accent" /> Temperature Forecast (°C)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={data.hourly}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="temp" stroke="hsl(36, 100%, 50%)" fill="hsl(36, 100%, 50%, 0.15)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="card-shadow">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Droplets className="h-4 w-4 text-secondary" /> Humidity Forecast (%)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={data.hourly}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="humidity" stroke="hsl(122, 35%, 56%)" fill="hsl(122, 35%, 56%, 0.15)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
