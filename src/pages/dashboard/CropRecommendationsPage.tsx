import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, TrendingUp, AlertTriangle, Droplets, ThermometerSun, FlaskConical, Timer, IndianRupee, Star, ChevronDown, ChevronUp, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { useWeather } from "@/hooks/useWeather";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { generateCropRecommendations, getCurrentSeason, type CropRecommendation } from "@/services/cropRecommendationEngine";

function ConfidenceBar({ value, label }: { value: number; label: string }) {
    const color = value >= 75 ? "bg-primary" : value >= 50 ? "bg-accent" : "bg-destructive";
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
}

function CropCard({ crop, rank }: { crop: CropRecommendation; rank: number }) {
    const [expanded, setExpanded] = useState(rank === 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.08 }}
        >
            <Card className={`card-shadow hover:card-shadow-hover transition-all duration-300 ${rank === 1 ? "border-primary border-2" : ""}`}>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {rank <= 3 && (
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${rank === 1 ? "bg-primary" : rank === 2 ? "bg-secondary" : "bg-accent"
                                    }`}>
                                    #{rank}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{crop.emoji}</span>
                                    <div>
                                        <h3 className="font-bold text-lg">{crop.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{crop.season}</span>
                                            <span>•</span>
                                            <span>{crop.waterNeed} water</span>
                                            <span>•</span>
                                            <span>{crop.growthDuration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1">
                                <Star className={`h-4 w-4 ${crop.confidence >= 70 ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                                <AnimatedNumber value={crop.confidence} suffix="%" className="text-2xl font-bold" />
                            </div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                            <p className="text-sm font-bold">{crop.yieldPrediction}</p>
                            <p className="text-xs text-muted-foreground">Expected Yield</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <IndianRupee className="h-4 w-4 mx-auto text-accent mb-1" />
                            <p className="text-sm font-bold">{crop.marketPrice}</p>
                            <p className="text-xs text-muted-foreground">Market Price</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <Timer className="h-4 w-4 mx-auto text-secondary mb-1" />
                            <p className="text-sm font-bold">{crop.growthDuration}</p>
                            <p className="text-xs text-muted-foreground">Growth Time</p>
                        </div>
                    </div>

                    {/* Match bars */}
                    <div className="mt-4 space-y-2">
                        <ConfidenceBar value={crop.soilMatch} label="Soil Match" />
                        <ConfidenceBar value={crop.climateMatch} label="Climate Match" />
                    </div>

                    {/* Expand/collapse details */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-3 flex items-center gap-1 text-sm text-primary font-medium hover:underline w-full justify-center"
                    >
                        {expanded ? "Hide Details" : "Show Details"}
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 space-y-3">
                                    {crop.reasons.length > 0 && (
                                        <div className="bg-primary/5 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                                                <Sprout className="h-3 w-3" /> Why This Crop?
                                            </p>
                                            {crop.reasons.map((r, i) => (
                                                <p key={i} className="text-xs text-muted-foreground mb-1">{r}</p>
                                            ))}
                                        </div>
                                    )}
                                    {crop.risks.length > 0 && (
                                        <div className="bg-destructive/5 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Potential Risks
                                            </p>
                                            {crop.risks.map((r, i) => (
                                                <p key={i} className="text-xs text-muted-foreground mb-1">{r}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function CropRecommendationsPage() {
    const { current, isLive, lastUpdated, mode } = useSensorData();
    const { data: weatherData } = useWeather();
    const season = getCurrentSeason();

    const recommendations = generateCropRecommendations(current, weatherData);
    const topCrops = recommendations.slice(0, 6);

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading">🌾 AI Crop Recommendations</h1>
                    <p className="text-muted-foreground text-sm">
                        Personalized recommendations based on live sensor data & weather
                    </p>
                </div>
                <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} mode={mode} />
            </div>

            {/* Current conditions panel */}
            <Card className="card-shadow overflow-hidden">
                <div className="hero-gradient p-5 text-primary-foreground">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-primary-foreground/70 mb-1">Current Agricultural Season</p>
                            <p className="text-xl font-bold font-heading">
                                {season.emoji} {season.name} Season
                            </p>
                            <p className="text-sm text-primary-foreground/80">{season.desc}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center bg-white/10 rounded-lg p-3">
                                <Droplets className="h-4 w-4 mx-auto mb-1" />
                                <p className="text-sm font-bold">
                                    {current ? <AnimatedNumber value={current.moisture} decimals={1} suffix="%" /> : "—"}
                                </p>
                                <p className="text-xs opacity-70">Moisture</p>
                            </div>
                            <div className="text-center bg-white/10 rounded-lg p-3">
                                <ThermometerSun className="h-4 w-4 mx-auto mb-1" />
                                <p className="text-sm font-bold">
                                    {weatherData ? <AnimatedNumber value={weatherData.current.temp} decimals={1} suffix="°C" /> : current ? <AnimatedNumber value={current.temperature} decimals={1} suffix="°C" /> : "—"}
                                </p>
                                <p className="text-xs opacity-70">Temperature</p>
                            </div>
                            <div className="text-center bg-white/10 rounded-lg p-3">
                                <FlaskConical className="h-4 w-4 mx-auto mb-1" />
                                <p className="text-sm font-bold">
                                    {current ? <AnimatedNumber value={current.soilPH} decimals={2} /> : "—"}
                                </p>
                                <p className="text-xs opacity-70">Soil pH</p>
                            </div>
                            <div className="text-center bg-white/10 rounded-lg p-3">
                                <Leaf className="h-4 w-4 mx-auto mb-1" />
                                <p className="text-sm font-bold">
                                    {current ? `${current.nitrogen}/${current.phosphorus}/${current.potassium}` : "—"}
                                </p>
                                <p className="text-xs opacity-70">N / P / K</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Top pick highlight */}
            {topCrops.length > 0 && (
                <Card className="card-shadow border-l-4 border-l-accent bg-accent/5">
                    <CardContent className="pt-5 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-3xl">
                                {topCrops[0].emoji}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-accent font-medium uppercase tracking-wide">🏆 AI Top Pick for Your Farm</p>
                                <p className="text-2xl font-bold font-heading">{topCrops[0].name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Confidence: <strong>{topCrops[0].confidence}%</strong> • Yield: <strong>{topCrops[0].yieldPrediction}</strong> • Market: <strong>{topCrops[0].marketPrice}</strong>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendation cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {topCrops.map((crop, i) => (
                    <CropCard key={crop.name} crop={crop} rank={i + 1} />
                ))}
            </div>

            {/* How it works */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-primary" /> How AI Recommendations Work
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        {[
                            { step: "1", title: "Sensor Data", desc: "Live soil moisture, pH, NPK readings every 5 seconds" },
                            { step: "2", title: "Weather Analysis", desc: "Real-time temperature, humidity, rain forecast" },
                            { step: "3", title: "Season Detection", desc: "Auto-detects Kharif/Rabi/Zaid from date" },
                            { step: "4", title: "AI Scoring", desc: "Matches against crop database, ranks by confidence" },
                        ].map((item) => (
                            <div key={item.step} className="p-3">
                                <div className="h-8 w-8 rounded-full hero-gradient text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                                    {item.step}
                                </div>
                                <p className="text-sm font-semibold">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
