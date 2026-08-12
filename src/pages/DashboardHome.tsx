import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Droplets, Thermometer, Leaf, Cloud, TrendingUp, Wheat, AlertTriangle, Brain, Sprout, Zap, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSensorData } from "@/hooks/useSensorData";
import { useWeather } from "@/hooks/useWeather";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { generateCropRecommendations, type CropRecommendation } from "@/services/cropRecommendationEngine";
import { AiReportModal } from "@/components/dashboard/AiReportModal";

/* ─── Circular Gauge ─── */
function CircularGauge({ value, max = 100, size = 140 }: { value: number; max?: number; size?: number }) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value / max;
  const offset = circumference * (1 - pct);
  const color = value >= 75 ? "hsl(122, 45%, 33%)" : value >= 50 ? "hsl(36, 100%, 50%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Heart className="h-5 w-5 text-primary mb-1" />
        <AnimatedNumber value={value} className="text-3xl font-bold" />
        <span className="text-xs text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, unit, sub, color }: { icon: any; label: string; value: number; unit?: string; sub?: string; color: string }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
    <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">
              <AnimatedNumber value={value} decimals={unit === "°C" || unit === "%" ? 1 : 0} suffix={unit || ""} />
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function DashboardHome() {
  const { current, chartData, isLive, lastUpdated, mode } = useSensorData();
  const { data: weatherData } = useWeather();
  const { user } = useAuth();

  // Get the user's first name for greeting
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Farmer";

  // Generate real-time crop recommendations based on live IoT data
  const recommendations = generateCropRecommendations(current, weatherData);
  const topCrop = recommendations[0];

  const cropPrices = [
    { crop: "Rice", price: 2100 }, { crop: "Wheat", price: 2275 },
    { crop: "Cotton", price: 6500 }, { crop: "Sugarcane", price: 3150 },
    { crop: "Maize", price: 1962 },
  ];

  const weatherDesc = weatherData
    ? `${weatherData.current.temp}°C • ${weatherData.current.description} • ${weatherData.location}`
    : "Loading weather...";

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome + Live badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome back, {firstName}! 👋</h1>
          <p className="text-muted-foreground text-sm">Here's what's happening on your farm today.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <AiReportModal sensorData={current || {}} />
          <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} mode={mode} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>{weatherDesc}</span>
          </div>
        </div>
      </div>

      {/* Farm Health Gauge + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="card-shadow lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <p className="text-sm font-semibold mb-3">Farm Health Score</p>
            <CircularGauge value={current?.farmHealth ?? 0} />
            <p className="text-xs text-muted-foreground mt-3">
              {(current?.farmHealth ?? 0) >= 75 ? "Good condition ✓" : (current?.farmHealth ?? 0) >= 50 ? "Needs attention ⚠" : "Critical ✕"}
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Droplets} label="Soil Moisture" value={current?.moisture ?? 0} unit="%" sub="Real-time sensor" color="bg-secondary text-secondary-foreground" />
          <StatCard icon={Thermometer} label="Temperature" value={current?.temperature ?? 0} unit="°C" sub={weatherData ? weatherData.current.description : "Loading..."} color="bg-accent text-accent-foreground" />
          <StatCard icon={Leaf} label="Soil pH" value={current?.soilPH ?? 0} unit="" sub={current?.soilPH ? (current.soilPH < 6.5 ? "Acidic" : current.soilPH > 7.0 ? "Alkaline" : "Optimal ✓") : ""} color="hero-gradient text-primary-foreground" />
          <StatCard icon={Sprout} label="NPK Index" value={current ? Math.round((current.nitrogen + current.phosphorus + current.potassium) / 3) : 0} unit="%" sub={current ? `N:${current.nitrogen} P:${current.phosphorus} K:${current.potassium}` : ""} color="hero-gradient text-primary-foreground" />
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="h-4 w-4 text-secondary" /> Soil Moisture (Live)
              </CardTitle>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" /> Market Prices (₹/quintal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cropPrices}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="crop" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="price" fill="hsl(122, 45%, 33%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wheat className="h-4 w-4 text-primary" /> AI Crop Pick (Live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCrop ? (
              <>
                <p className="text-lg font-bold text-primary flex items-center gap-1">
                  <span>{topCrop.emoji}</span> {topCrop.name} <span className="text-xs ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">{topCrop.season}</span>
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-2">Yield: {topCrop.yieldPrediction}</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence: {topCrop.confidence}% based on NPK & Weather</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for sensor data...</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4 text-secondary" /> Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherData ? (
              <>
                <p className="text-lg font-semibold">
                  <AnimatedNumber value={weatherData.current.temp} decimals={1} suffix="°C" /> — {weatherData.current.icon}
                </p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{weatherData.current.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Humidity: <AnimatedNumber value={weatherData.current.humidity} suffix="%" /> |
                  Wind: <AnimatedNumber value={weatherData.current.windSpeed} decimals={1} suffix=" km/h" />
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading weather...</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow border-l-4 border-l-accent hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-accent" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {current && current.moisture < 40 ? (
              <>
                <p className="text-sm font-medium text-destructive">🚨 Low moisture: <AnimatedNumber value={current.moisture} decimals={1} suffix="%" /></p>
                <p className="text-sm text-muted-foreground mt-2">💧 Irrigation recommended now</p>
              </>
            ) : current && current.temperature > 35 ? (
              <>
                <p className="text-sm font-medium text-accent">⚠ High temperature: <AnimatedNumber value={current.temperature} decimals={1} suffix="°C" /></p>
                <p className="text-sm text-muted-foreground mt-2">🌡️ Consider shade nets</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-primary">✅ All systems normal</p>
                <p className="text-sm text-muted-foreground mt-2">No active alerts</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Govt. Schemes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-primary">PM-KISAN</p>
            <p className="text-xs text-muted-foreground mt-1">₹6,000/year direct income support</p>
            <p className="text-sm font-medium text-primary mt-3">Soil Health Card</p>
            <p className="text-xs text-muted-foreground mt-1">Free soil testing & recommendations</p>
          </CardContent>
        </Card>
      </div>

      {/* AI feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-shadow border border-dashed border-primary/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl hero-gradient flex items-center justify-center shrink-0">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">{topCrop?.name ?? "Crop"} Yield Prediction</p>
              <p className="text-xs text-muted-foreground">AI model predicts expected yield from live sensor & weather data.</p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-xl font-bold text-primary">{topCrop ? topCrop.yieldPrediction.split(" ")[0] : "—"}</p>
              <p className="text-xs text-primary font-medium">{topCrop ? topCrop.yieldPrediction.split(" ")[1] : "q/ha"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border border-dashed border-secondary/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold">Smart Irrigation Alert</p>
              <p className="text-xs text-muted-foreground">
                {current && current.moisture < 45
                  ? `Moisture at ${current.moisture}% — irrigation needed!`
                  : "Water levels optimal. AI monitoring active."}
              </p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-xl font-bold text-secondary">-28%</p>
              <p className="text-xs text-muted-foreground">Water savings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
