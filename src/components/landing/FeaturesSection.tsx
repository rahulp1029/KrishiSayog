import { motion } from "framer-motion";
import { Activity, Brain, Bug, BellRing, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Activity,
    title: "Real-Time Soil Monitoring",
    description: "Track moisture, pH, temperature, and NPK levels from IoT sensors deployed across your fields.",
    link: "/dashboard/soil",
    gradient: "from-emerald-400 to-emerald-600",
    shadow: "shadow-emerald-500/20",
    bgAccent: "bg-emerald-50",
    textAccent: "text-emerald-600",
  },
  {
    icon: Brain,
    title: "AI Crop Recommendation",
    description: "Get personalized crop suggestions based on live soil composition, weather, and market data.",
    link: "/dashboard/crops",
    gradient: "from-blue-400 to-blue-600",
    shadow: "shadow-blue-500/20",
    bgAccent: "bg-blue-50",
    textAccent: "text-blue-600",
  },
  {
    icon: Bug,
    title: "Plant Disease Detection",
    description: "Upload a leaf photo and instantly identify diseases with AI-powered image recognition.",
    link: "/disease-detection",
    gradient: "from-amber-400 to-amber-600",
    shadow: "shadow-amber-500/20",
    bgAccent: "bg-amber-50",
    textAccent: "text-amber-600",
  },
  {
    icon: BellRing,
    title: "Smart Alerts & Irrigation",
    description: "Receive real-time alerts for low moisture, pest risks, and weather changes. Automate irrigation.",
    link: "/dashboard/alerts",
    gradient: "from-purple-400 to-purple-600",
    shadow: "shadow-purple-500/20",
    bgAccent: "bg-purple-50",
    textAccent: "text-purple-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32 bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
            Core Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Powerful Features for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Smart Farming
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-medium">
            Everything you need to transform traditional farming into data-driven agriculture.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }}
              className="group h-full"
            >
              <Link to={f.link} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                <div className="relative h-full bg-white border border-border/60 hover:border-transparent rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden z-10">

                  {/* Hover Graphic / Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                  <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-10 blur-2xl rounded-full transition-opacity duration-500`} />

                  <div className="relative z-20">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 bg-gradient-to-br ${f.gradient}`}>
                      <f.icon className="h-6 w-6 text-white" />
                    </div>

                    <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {f.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                      {f.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
