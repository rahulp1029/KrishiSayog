import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSensorData } from "@/hooks/useSensorData";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Droplets, Thermometer, Wind, Zap, Wifi, WifiOff, ToggleLeft, ToggleRight, Sun, AlertCircle, CheckCircle2, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IOT_CONFIG } from "@/services/iotConfig";

type ActuatorState = {
  irrigationPump: boolean;
  fertiliserPump: boolean;
  shadingNet: boolean;
  ventilation: boolean;
  growLight: boolean;
};

type ESP32Status = "connected" | "disconnected" | "simulator";

const actuatorConfig = [
  {
    key: "irrigationPump" as keyof ActuatorState,
    label: "Irrigation Pump",
    icon: Droplets,
    description: "Controls main water supply to crop fields",
    color: "bg-blue-50 border-blue-200",
    activeColor: "text-blue-600",
    command: "pump",
  },
  {
    key: "fertiliserPump" as keyof ActuatorState,
    label: "Fertiliser Injector",
    icon: Zap,
    description: "Liquid nutrient dosing into irrigation line",
    color: "bg-green-50 border-green-200",
    activeColor: "text-green-600",
    command: "fertiliser",
  },
  {
    key: "shadingNet" as keyof ActuatorState,
    label: "Shading Net",
    icon: Sun,
    description: "UV shading for high-temperature protection",
    color: "bg-yellow-50 border-yellow-200",
    activeColor: "text-yellow-600",
    command: "shading",
  },
  {
    key: "ventilation" as keyof ActuatorState,
    label: "Ventilation Fan",
    icon: Wind,
    description: "Airflow control for humidity management",
    color: "bg-purple-50 border-purple-200",
    activeColor: "text-purple-600",
    command: "vent",
  },
  {
    key: "growLight" as keyof ActuatorState,
    label: "Grow Light",
    icon: Sun,
    description: "Supplemental LED lighting for low-light periods",
    color: "bg-orange-50 border-orange-200",
    activeColor: "text-orange-600",
    command: "light",
  },
];

async function sendActuatorCommand(command: string, state: boolean): Promise<boolean> {
  if (IOT_CONFIG.IOT_MODE !== "real") {
    // Simulate network delay in simulator mode
    await new Promise(r => setTimeout(r, 400));
    return true;
  }
  try {
    const res = await fetch(`${IOT_CONFIG.ESP32_URL}/api/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function IotControlPage() {
  const { current, isLive, lastUpdated, mode } = useSensorData();
  const [actuators, setActuators] = useState<ActuatorState>({
    irrigationPump: false,
    fertiliserPump: false,
    shadingNet: false,
    ventilation: false,
    growLight: false,
  });
  const [pending, setPending] = useState<keyof ActuatorState | null>(null);
  const [esp32Status] = useState<ESP32Status>(
    IOT_CONFIG.IOT_MODE === "real" ? "connected" : "simulator"
  );
  const [commandLog, setCommandLog] = useState<{ time: string; msg: string; ok: boolean }[]>([]);

  // Auto-suggest irrigation
  const irrigationNeeded = (current?.moisture ?? 60) < 45;
  const highTemp = (current?.temperature ?? 25) > 34;

  const handleToggle = async (key: keyof ActuatorState) => {
    const config = actuatorConfig.find(a => a.key === key)!;
    const newState = !actuators[key];
    setPending(key);
    const ok = await sendActuatorCommand(config.command, newState);
    setPending(null);
    if (ok) {
      setActuators(prev => ({ ...prev, [key]: newState }));
      setCommandLog(prev => [
        {
          time: new Date().toLocaleTimeString(),
          msg: `${config.label} → ${newState ? "ON" : "OFF"}`,
          ok: true,
        },
        ...prev.slice(0, 9),
      ]);
    } else {
      setCommandLog(prev => [
        { time: new Date().toLocaleTimeString(), msg: `Failed: ${config.label}`, ok: false },
        ...prev.slice(0, 9),
      ]);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" /> IoT Control Panel
          </h1>
          <p className="text-muted-foreground text-sm">Remote actuator control via ESP32 gateway</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={esp32Status === "connected" ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {esp32Status === "connected" ? (
              <><Wifi className="h-3 w-3" /> ESP32 Connected</>
            ) : esp32Status === "simulator" ? (
              <><Wifi className="h-3 w-3" /> Simulator Mode</>
            ) : (
              <><WifiOff className="h-3 w-3" /> Disconnected</>
            )}
          </Badge>
          <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} mode={mode} />
        </div>
      </div>

      {/* Smart suggestions */}
      <AnimatePresence>
        {(irrigationNeeded || highTemp) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {irrigationNeeded && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Low Moisture Detected</p>
                      <p className="text-xs text-blue-600">
                        Soil moisture at <AnimatedNumber value={current?.moisture ?? 0} decimals={1} suffix="%" /> — irrigation recommended
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => !actuators.irrigationPump && handleToggle("irrigationPump")}
                    disabled={actuators.irrigationPump}
                  >
                    {actuators.irrigationPump ? "Running" : "Start Pump"}
                  </Button>
                </CardContent>
              </Card>
            )}
            {highTemp && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">High Temperature Alert</p>
                      <p className="text-xs text-orange-600">
                        Temp at <AnimatedNumber value={current?.temperature ?? 0} decimals={1} suffix="°C" /> — deploy shading net?
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                    onClick={() => !actuators.shadingNet && handleToggle("shadingNet")}
                    disabled={actuators.shadingNet}
                  >
                    {actuators.shadingNet ? "Deployed" : "Deploy Net"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Sensor Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: "Moisture", value: current?.moisture ?? 0, unit: "%", color: "text-blue-600" },
          { icon: Thermometer, label: "Temp", value: current?.temperature ?? 0, unit: "°C", color: "text-orange-500" },
          { icon: Wind, label: "Humidity", value: current?.humidity ?? 0, unit: "%", color: "text-purple-600" },
          { icon: Sun, label: "Light", value: current ? Math.round(current.lightIntensity / 100) / 10 : 0, unit: " klux", color: "text-yellow-500" },
        ].map(s => (
          <Card key={s.label} className="card-shadow">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">
                <AnimatedNumber value={s.value} decimals={1} suffix={s.unit} />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actuator Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actuatorConfig.map(a => {
          const isOn = actuators[a.key];
          const isPending = pending === a.key;
          return (
            <motion.div key={a.key} layout>
              <Card className={`card-shadow border ${isOn ? a.color : ""} transition-all duration-300`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <a.icon className={`h-4 w-4 ${isOn ? a.activeColor : "text-muted-foreground"}`} />
                      {a.label}
                    </CardTitle>
                    <Badge variant={isOn ? "default" : "secondary"} className="text-[10px]">
                      {isOn ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{a.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleToggle(a.key)}
                    disabled={isPending}
                    variant={isOn ? "destructive" : "default"}
                    className="w-full gap-2"
                  >
                    {isPending ? (
                      <span className="animate-spin">⟳</span>
                    ) : isOn ? (
                      <><ToggleRight className="h-4 w-4" /> Turn OFF</>
                    ) : (
                      <><ToggleLeft className="h-4 w-4" /> Turn ON</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Command Log */}
      {commandLog.length > 0 && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Command Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {commandLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {log.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="text-muted-foreground text-xs">{log.time}</span>
                  <span className={log.ok ? "" : "text-destructive"}>{log.msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESP32 Connection Guide */}
      {esp32Status === "simulator" && (
        <Card className="border-dashed">
          <CardContent className="py-4 px-5">
            <p className="text-sm font-semibold mb-1">Connect your ESP32 Hardware</p>
            <p className="text-xs text-muted-foreground">
              In <code className="bg-muted px-1 rounded">src/services/iotConfig.ts</code>, set{" "}
              <code className="bg-muted px-1 rounded">IOT_MODE: "real"</code> and update{" "}
              <code className="bg-muted px-1 rounded">ESP32_URL</code> to your device IP.
              The ESP32 should expose a <code className="bg-muted px-1 rounded">POST /api/control</code> endpoint.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
