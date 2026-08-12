import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Cloud, Droplets, Leaf, ArrowRight } from "lucide-react";

export function DashboardPreview() {
  return (
    <section className="py-20 md:py-28 section-alt">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
            Dashboard Preview
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Your <span className="text-gradient-primary">Smart Dashboard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Monitor soil health, weather, crop recommendations, and alerts — all in one place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Browser frame */}
          <div className="rounded-2xl overflow-hidden card-shadow border border-border bg-card">
            {/* Title bar */}
            <div className="bg-muted px-4 py-2.5 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground bg-background rounded px-3 py-1">
                  dashboard.krishisayog.com
                </span>
              </div>
            </div>

            {/* Dashboard content mock */}
            <div className="p-4 md:p-6 bg-background">
              <div className="flex gap-4">
                {/* Mini sidebar */}
                <div className="hidden md:block w-48 shrink-0">
                  <div className="bg-primary rounded-xl p-4 text-primary-foreground space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Leaf className="h-4 w-4" /> KrishiSayog
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {["Dashboard", "Soil Data", "Crop AI", "Weather", "Market", "Alerts"].map((item, i) => (
                        <div key={item} className={`rounded px-2 py-1.5 ${i === 0 ? "bg-white/20 font-medium" : "opacity-70"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main area */}
                <div className="flex-1 space-y-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Farm Health", value: "87/100", icon: "❤️", color: "border-l-primary" },
                      { label: "Moisture", value: "62%", icon: "💧", color: "border-l-secondary" },
                      { label: "Temperature", value: "28°C", icon: "🌡️", color: "border-l-accent" },
                      { label: "Soil pH", value: "6.5", icon: "🧪", color: "border-l-primary" },
                    ].map((card) => (
                      <div key={card.label} className={`bg-card rounded-lg p-3 border-l-4 ${card.color} shadow-sm`}>
                        <p className="text-xs text-muted-foreground">{card.icon} {card.label}</p>
                        <p className="text-lg font-bold mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts mock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <Droplets className="h-3.5 w-3.5" /> Soil Moisture (24h)
                      </div>
                      <div className="flex items-end gap-1 h-20">
                        {[58, 55, 50, 45, 42, 48, 55, 60, 62, 58, 65, 60].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-primary/20 rounded-t"
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <Cloud className="h-3.5 w-3.5" /> Weather Forecast
                      </div>
                      <div className="space-y-2">
                        {[
                          { day: "Today", temp: "28°C", icon: "☀️" },
                          { day: "Tomorrow", temp: "30°C", icon: "⛅" },
                          { day: "Wednesday", temp: "24°C", icon: "🌧️" },
                        ].map((d) => (
                          <div key={d.day} className="flex items-center justify-between text-xs">
                            <span>{d.icon} {d.day}</span>
                            <span className="font-medium">{d.temp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating decorations */}
          <motion.div
            className="absolute -top-6 -right-6 bg-accent rounded-xl p-3 card-shadow hidden md:flex items-center gap-2"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <BarChart3 className="h-5 w-5 text-accent-foreground" />
            <div className="text-xs">
              <p className="font-semibold text-accent-foreground">Yield ↑35%</p>
            </div>
          </motion.div>
          <motion.div
            className="absolute -bottom-4 -left-4 bg-card rounded-xl p-3 card-shadow hidden md:flex items-center gap-2 border"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          >
            <Droplets className="h-5 w-5 text-secondary" />
            <div className="text-xs">
              <p className="font-semibold">Moisture OK</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="text-center mt-10">
          <Link to="/dashboard">
            <Button className="hero-gradient text-primary-foreground font-semibold h-11 px-8 gap-2">
              Explore Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
