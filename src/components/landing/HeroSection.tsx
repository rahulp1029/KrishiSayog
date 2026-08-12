import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sprout, ArrowRight, Play, CheckCircle2, CloudLightning, LineChart, Leaf } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 lg:pt-36 lg:pb-40">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl rounded-[100%] pointer-events-none -z-10" />
      <div className="absolute top-40 -left-64 w-96 h-96 bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-60 -right-64 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          {/* Left Column (Text) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <Sprout className="h-4 w-4" />
              <span>AI-Powered Agriculture Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
              Farming Intelligence <br className="hidden md:block" />
              for a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Sustainable Future
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Transform your farming with AI. Get real-time soil insights, weather predictions, intelligent crop recommendations, and market trends all in one stunning dashboard.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4"
            >
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white border-border/60 hover:bg-muted/50 transition-all duration-300">
                <Play className="mr-2 h-5 w-5 text-accent" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Proof statements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-border/40 mt-10"
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-3xl font-black text-foreground">10K+</span>
                <span className="text-sm font-medium text-muted-foreground">Active Farmers</span>
              </div>
              <div className="w-[1px] h-12 bg-border/60" />
              <div className="flex flex-col gap-1 text-left">
                <span className="text-3xl font-black text-foreground">98.5%</span>
                <span className="text-sm font-medium text-muted-foreground">AI Accuracy</span>
              </div>
              <div className="w-[1px] h-12 bg-border/60 hidden sm:block" />
              <div className="flex flex-col gap-1 text-left hidden sm:flex">
                <span className="text-3xl font-black text-foreground">12</span>
                <span className="text-sm font-medium text-muted-foreground">States Covered</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column (Visual) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            {/* The Dashboard Mockup */}
            <div className="relative rounded-2xl border border-border/50 bg-white/60 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden transform lg:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-in-out">
              {/* Fake Browser header */}
              <div className="flex items-center px-4 py-3 border-b border-border/50 bg-white/80">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-muted/50 rounded-md px-3 py-1 flex items-center justify-center text-xs text-muted-foreground font-medium w-1/2">
                  app.krishisayog.in
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Farm Overview</h3>
                    <p className="text-xs text-muted-foreground">Live telemetry & AI insights</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-primary" />
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-semibold text-muted-foreground">Soil Health</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">94<span className="text-sm font-medium text-muted-foreground">/100</span></p>
                    <div className="mt-2 text-[10px] text-green-600 font-medium bg-green-50 w-max px-2 py-0.5 rounded-full">+2% this week</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudLightning className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-muted-foreground">Moisture</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">62%</p>
                    <div className="mt-2 text-[10px] text-blue-600 font-medium bg-blue-50 w-max px-2 py-0.5 rounded-full">Optimal Level</div>
                  </div>
                </div>

                {/* Big Chart Area */}
                <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-muted-foreground">Yield Prediction (Tonnes)</span>
                    <LineChart className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-end gap-2 h-24 pt-2">
                    {[30, 45, 35, 60, 50, 85, 75].map((h, i) => (
                      <div key={i} className="relative flex-1 flex items-end justify-center h-full group">
                        <motion.div
                          className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary/80 transition-colors"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                        />
                        {i === 5 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2 }}
                            className="absolute -top-7 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
                          >
                            Peak
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decoration cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-1/4 bg-white border border-border/50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-10 hidden sm:flex"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">AI Suggestion</p>
                <p className="text-[10px] text-muted-foreground">Plant Wheat Next Week</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-1/4 bg-white border border-border/50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-10 hidden sm:flex"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CloudLightning className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Rain Expected</p>
                <p className="text-[10px] text-muted-foreground">In 48 Hours</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
