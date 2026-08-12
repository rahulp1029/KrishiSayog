import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSensorData } from "@/hooks/useSensorData";
import { useWeather } from "@/hooks/useWeather";
import { Download, FileText, FileJson, BarChart3, CheckCircle2, Loader2, Database } from "lucide-react";
import { motion } from "framer-motion";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sensorToCSVRow(r: any): string {
  return [
    new Date(r.timestamp).toISOString(),
    r.moisture,
    r.temperature,
    r.humidity,
    r.soilPH,
    r.soilTemp,
    r.nitrogen,
    r.phosphorus,
    r.potassium,
    r.farmHealth,
    r.lightIntensity,
  ].join(",");
}

const CSV_HEADER = "Timestamp,Moisture(%),Temperature(°C),Humidity(%),SoilPH,SoilTemp(°C),Nitrogen(mg/kg),Phosphorus(mg/kg),Potassium(mg/kg),FarmHealth,LightIntensity(lux)";

export default function DataExportSection() {
  const { current, history } = useSensorData();
  const { data: weatherData } = useWeather();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);

  const handleDownload = async (type: string) => {
    setDownloading(type);
    await new Promise(r => setTimeout(r, 600)); // UX: show loading state

    const ts = new Date().toISOString().slice(0, 10);

    if (type === "sensor-csv") {
      const rows = history.length > 0 ? history : current ? [current] : [];
      const csv = [CSV_HEADER, ...rows.map(sensorToCSVRow)].join("\n");
      downloadFile(csv, `krishisayog-sensors-${ts}.csv`, "text/csv");
    }

    if (type === "sensor-json") {
      const json = JSON.stringify({ exportedAt: new Date().toISOString(), readings: history.length > 0 ? history : [current] }, null, 2);
      downloadFile(json, `krishisayog-sensors-${ts}.json`, "application/json");
    }

    if (type === "weather-json") {
      const json = JSON.stringify({ exportedAt: new Date().toISOString(), weather: weatherData }, null, 2);
      downloadFile(json, `krishisayog-weather-${ts}.json`, "application/json");
    }

    if (type === "snapshot-json") {
      const snapshot = {
        exportedAt: new Date().toISOString(),
        currentSensors: current,
        currentWeather: weatherData?.current ?? null,
        historyCount: history.length,
        farmHealthStatus: current ? (current.farmHealth >= 75 ? "Good" : current.farmHealth >= 50 ? "Moderate" : "Critical") : "Unknown",
      };
      downloadFile(JSON.stringify(snapshot, null, 2), `krishisayog-snapshot-${ts}.json`, "application/json");
    }

    setDownloading(null);
    setDownloaded(prev => [...prev, type]);
    setTimeout(() => setDownloaded(prev => prev.filter(d => d !== type)), 3000);
  };

  const exportOptions = [
    {
      id: "sensor-csv",
      title: "Sensor History — CSV",
      desc: `${history.length} readings • Moisture, Temp, Humidity, pH, NPK, Light`,
      icon: FileText,
      badge: `${history.length} rows`,
      badgeColor: "default" as const,
    },
    {
      id: "sensor-json",
      title: "Sensor History — JSON",
      desc: "Full sensor history in structured JSON format",
      icon: FileJson,
      badge: "JSON",
      badgeColor: "secondary" as const,
    },
    {
      id: "weather-json",
      title: "Weather Data — JSON",
      desc: "Current, hourly & daily forecast data",
      icon: BarChart3,
      badge: weatherData ? "Live" : "No data",
      badgeColor: weatherData ? "default" as const : "secondary" as const,
    },
    {
      id: "snapshot-json",
      title: "Farm Snapshot — JSON",
      desc: "Point-in-time summary: sensors + weather + health status",
      icon: Database,
      badge: "Snapshot",
      badgeColor: "secondary" as const,
    },
  ];

  return (
    <div className="space-y-4">
      {exportOptions.map((opt, i) => {
        const isLoading = downloading === opt.id;
        const isDone = downloaded.includes(opt.id);
        return (
          <motion.div key={opt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="card-shadow hover:card-shadow-hover transition-all duration-200">
              <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <opt.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <Badge variant={opt.badgeColor} className="text-[10px]">{opt.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{opt.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isDone ? "outline" : "default"}
                  onClick={() => handleDownload(opt.id)}
                  disabled={isLoading}
                  className="shrink-0 gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Preparing...</>
                  ) : isDone ? (
                    <><CheckCircle2 className="h-4 w-4 text-primary" /> Downloaded</>
                  ) : (
                    <><Download className="h-4 w-4" /> Download</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
