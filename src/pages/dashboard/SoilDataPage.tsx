import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Leaf, Layers, Wind, Sun } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useSensorData } from "@/hooks/useSensorData";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { AiReportModal } from "@/components/dashboard/AiReportModal";

function GaugeCard({ icon: Icon, label, value, unit, color, optimal }: { icon: any; label: string; value: number; unit: string; color: string; optimal: string }) {
    const pct = Math.min(value / 100, 1) * 100;
    return (
        <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-xl font-bold">
                            <AnimatedNumber value={value} decimals={unit === "" ? 2 : 1} suffix={unit} />
                        </p>
                    </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full hero-gradient"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Optimal: {optimal}</p>
            </CardContent>
        </Card>
    );
}

export default function SoilDataPage() {
    const { current, chartData, isLive, lastUpdated, mode } = useSensorData();

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading">🌍 Soil Data & Diagnostics</h1>
                    <p className="text-muted-foreground text-sm">Real-time sensor telemetry and AI-generated soil advisory reports</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <AiReportModal sensorData={current || {}} />
                    <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} mode={mode} />
                </div>
            </div>

            {/* Sensor cards — now live! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GaugeCard icon={Droplets} label="Soil Moisture" value={current?.moisture ?? 0} unit="%" color="bg-secondary text-secondary-foreground" optimal="50-75%" />
                <GaugeCard icon={Leaf} label="Soil pH" value={current?.soilPH ?? 0} unit="" color="hero-gradient text-primary-foreground" optimal="6.0-7.0" />
                <GaugeCard icon={Thermometer} label="Soil Temperature" value={current?.soilTemp ?? 0} unit="°C" color="bg-accent text-accent-foreground" optimal="20-30°C" />
                <GaugeCard icon={Layers} label="Organic Matter" value={current ? Math.round(current.farmHealth * 0.5) : 0} unit="%" color="hero-gradient text-primary-foreground" optimal="3-5%" />
            </div>

            {/* NPK Levels — live! */}
            <Card className="card-shadow">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            NPK Levels (Live)
                        </CardTitle>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Nitrogen (N)", value: current?.nitrogen ?? 0, fill: "hsl(122, 45%, 33%)" },
                            { name: "Phosphorus (P)", value: current?.phosphorus ?? 0, fill: "hsl(36, 100%, 50%)" },
                            { name: "Potassium (K)", value: current?.potassium ?? 0, fill: "hsl(122, 35%, 56%)" },
                        ].map((nutrient) => (
                            <div key={nutrient.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{nutrient.name}</span>
                                    <span className="text-muted-foreground font-bold">
                                        <AnimatedNumber value={nutrient.value} suffix=" mg/kg" />
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${nutrient.value}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: nutrient.fill }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Live Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-shadow">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-secondary" /> Moisture (Live)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData.length > 0 ? chartData : [{ time: "...", moisture: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="moisture" stroke="hsl(122, 45%, 33%)" fill="hsl(122, 45%, 33%, 0.15)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="card-shadow">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-accent" /> Temperature (Live)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData.length > 0 ? chartData : [{ time: "...", soilTemp: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip />
                                <Area type="monotone" dataKey="soilTemp" stroke="hsl(36, 100%, 50%)" fill="hsl(36, 100%, 50%, 0.15)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="card-shadow">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Wind className="h-4 w-4 text-purple-500" /> Air Humidity (Live)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData.length > 0 ? chartData : [{ time: "...", humidity: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                                <Tooltip formatter={(v: any) => [`${v}%`, "Humidity"]} />
                                <Area type="monotone" dataKey="humidity" stroke="hsl(270, 60%, 50%)" fill="hsl(270, 60%, 50%, 0.15)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="card-shadow">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sun className="h-4 w-4 text-yellow-500" /> Light Intensity (klux, Live)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData.length > 0 ? chartData : [{ time: "...", lightIntensity: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip formatter={(v: any) => [`${v} klux`, "Light"]} />
                                <Area type="monotone" dataKey="lightIntensity" stroke="hsl(45, 100%, 50%)" fill="hsl(45, 100%, 50%, 0.15)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
