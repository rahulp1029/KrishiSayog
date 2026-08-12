import { motion } from "framer-motion";
import { Heart, Droplets, Cloud, Wheat } from "lucide-react";
import { useEffect, useState } from "react";

const insights = [
  { icon: Heart, label: "Farm Health Score", value: 87, suffix: "/100", color: "text-primary", isGauge: true },
  { icon: Droplets, label: "Moisture Level", value: 62, suffix: "%", color: "text-secondary", isGauge: false },
  { icon: Cloud, label: "Weather Forecast", value: 28, suffix: "°C Sunny", color: "text-accent", isGauge: false },
  { icon: Wheat, label: "Crop Recommendation", value: 0, suffix: "Rice / Wheat", color: "text-primary", isGauge: false },
];

function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const step = Math.ceil(value / (duration / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [value, duration]);

  if (value === 0) return <span className="text-2xl font-bold mb-1">{suffix}</span>;
  return <span className="text-2xl font-bold mb-1">{count}{suffix}</span>;
}

function CircularGauge({ value, max = 100, size = 120 }: { value: number; max?: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value / max;
  const offset = circumference * (1 - pct);
  const color = value >= 75 ? "hsl(122, 45%, 33%)" : value >= 50 ? "hsl(36, 100%, 50%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">/ {max}</span>
      </div>
    </div>
  );
}

export function InsightsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
            Live Data
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Agriculture <span className="text-gradient-primary">Insights at a Glance</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Real-time analytics to keep you informed about your farm's performance.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {insights.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 card-shadow text-center hover:card-shadow-hover transition-all duration-300 group"
            >
              {item.isGauge ? (
                <div className="flex justify-center mb-3">
                  <CircularGauge value={item.value} />
                </div>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className={`h-7 w-7 ${item.color}`} />
                  </div>
                  <AnimatedCounter value={item.value} suffix={item.suffix} />
                </>
              )}
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
