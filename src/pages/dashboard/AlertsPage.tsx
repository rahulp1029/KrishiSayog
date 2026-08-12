import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Droplets, Bug, CloudRain, CheckCircle, Clock, Shield, Thermometer } from "lucide-react";
import { motion } from "framer-motion";
import { useSensorData } from "@/hooks/useSensorData";
import { useWeather } from "@/hooks/useWeather";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

type Alert = {
    id: string;
    type: string;
    icon: any;
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    time: string;
    action: string;
};

function generateAlerts(sensor: any, weather: any): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    if (sensor) {
        if (sensor.moisture < 40) {
            alerts.push({
                id: "moisture-low",
                type: "irrigation",
                icon: Droplets,
                title: `Low Moisture in Field — ${sensor.moisture}%`,
                description: `Soil moisture has dropped to ${sensor.moisture}%. Immediate irrigation recommended.`,
                severity: sensor.moisture < 30 ? "high" : "medium",
                time: now,
                action: "Irrigate Now",
            });
        }
        if (sensor.temperature > 35) {
            alerts.push({
                id: "temp-high",
                type: "temperature",
                icon: Thermometer,
                title: `High Temperature — ${sensor.temperature}°C`,
                description: `Air temperature at ${sensor.temperature}°C. Consider shade nets and extra irrigation.`,
                severity: sensor.temperature > 38 ? "high" : "medium",
                time: now,
                action: "View Details",
            });
        }
        if (sensor.soilPH < 5.8 || sensor.soilPH > 7.2) {
            alerts.push({
                id: "ph-range",
                type: "soil",
                icon: AlertTriangle,
                title: `Soil pH Out of Range — ${sensor.soilPH}`,
                description: `Soil pH at ${sensor.soilPH}. ${sensor.soilPH < 6 ? "Add lime to increase." : "Add sulfur to decrease."}`,
                severity: "medium",
                time: now,
                action: "View Details",
            });
        }
        if (sensor.humidity > 85) {
            alerts.push({
                id: "humid-high",
                type: "pest",
                icon: Bug,
                title: "Pest Risk — High Humidity",
                description: `Humidity at ${sensor.humidity}%. High risk of fungal diseases and pest infestation.`,
                severity: "medium",
                time: now,
                action: "View Details",
            });
        }
    }

    if (weather?.daily) {
        const rainyDays = weather.daily.filter((d: any) => d.pop > 60);
        if (rainyDays.length > 0) {
            alerts.push({
                id: "rain-forecast",
                type: "weather",
                icon: CloudRain,
                title: `Heavy Rain Expected — ${rainyDays[0].day}`,
                description: `${rainyDays[0].pop}% chance of rain on ${rainyDays[0].day}. Secure harvested crops.`,
                severity: rainyDays[0].pop > 80 ? "high" : "medium",
                time: "Forecast",
                action: "View Forecast",
            });
        }
    }

    // If no alerts, add a positive one
    if (alerts.length === 0) {
        alerts.push({
            id: "all-good",
            type: "status",
            icon: CheckCircle,
            title: "All Systems Normal",
            description: "All sensor readings are within optimal range. Your farm is in great condition!",
            severity: "low",
            time: now,
            action: "View Details",
        });
    }

    return alerts;
}

const resolvedAlerts = [
    { title: "pH Level Stabilized", desc: "Field C pH returned to optimal range (6.5)", time: "Yesterday" },
    { title: "Moisture Restored", desc: "Field A moisture restored after irrigation", time: "2 days ago" },
    { title: "Temperature Normal", desc: "Soil temperature dropped below 35°C threshold", time: "3 days ago" },
];

const severityColors: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-accent/10 text-accent border-accent/30",
    low: "bg-primary/10 text-primary border-primary/30",
};

export default function AlertsPage() {
    const { current, isLive, lastUpdated, mode } = useSensorData();
    const { data: weatherData } = useWeather();

    const alerts = generateAlerts(current, weatherData);
    const criticalCount = alerts.filter(a => a.severity === "high").length;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading">🔔 Alerts & Notifications</h1>
                    <p className="text-muted-foreground text-sm">AI-generated alerts based on live sensor readings</p>
                </div>
                <div className="flex items-center gap-3">
                    <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} mode={mode} />
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="card-shadow border-l-4 border-l-destructive">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                            <div>
                                <p className="text-2xl font-bold"><AnimatedNumber value={criticalCount} /></p>
                                <p className="text-xs text-muted-foreground">Critical Alerts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-shadow border-l-4 border-l-accent">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <Bell className="h-8 w-8 text-accent" />
                            <div>
                                <p className="text-2xl font-bold"><AnimatedNumber value={alerts.length} /></p>
                                <p className="text-xs text-muted-foreground">Active Alerts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-shadow border-l-4 border-l-primary">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">3</p>
                                <p className="text-xs text-muted-foreground">Resolved This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live alerts */}
            <Card className="card-shadow">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="h-4 w-4 text-accent" /> Active Alerts (Live)
                        </CardTitle>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {alerts.map((alert, i) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`rounded-lg border p-4 ${severityColors[alert.severity]}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <alert.icon className="h-5 w-5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{alert.title}</p>
                                    <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs opacity-60 flex items-center gap-1 shrink-0">
                                        <Clock className="h-3 w-3" />{alert.time}
                                    </span>
                                    <Button size="sm" variant="outline" className="text-xs shrink-0 h-7">
                                        {alert.action}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </CardContent>
            </Card>

            {/* Resolved */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" /> Recently Resolved
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {resolvedAlerts.map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{alert.title}</p>
                                <p className="text-xs text-muted-foreground">{alert.desc}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{alert.time}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
