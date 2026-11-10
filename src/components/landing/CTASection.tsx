import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, CheckCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="hero-gradient rounded-2xl p-10 md:p-16 relative overflow-hidden"
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/5"
                style={{
                  width: 100 + i * 60,
                  height: 100 + i * 60,
                  right: `${-5 + i * 8}%`,
                  top: `${-10 + i * 15}%`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-primary-foreground">
                Ready to Transform Your Farming?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-6 leading-relaxed">
                Book a free demo to see how KrishiSayog uses AI to help you grow smarter, reduce costs, and increase yields.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "AI-powered crop recommendations",
                  "Real-time soil health monitoring",
                  "Smart irrigation alerts",
                  "Government scheme suggestions",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-primary-foreground/90">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-8 gap-2 shadow-lg shadow-black/10">
                    Schedule Demo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/chatbot">
                  <Button className="h-12 px-8 bg-white hover:bg-white/90 text-primary font-bold gap-2 shadow-lg shadow-black/10 transition-all">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Talk to KrishiBot
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats / social proof */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="glass rounded-2xl p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "35%", label: "Average Yield Increase" },
                    { value: "₹2.5L", label: "Savings per Season" },
                    { value: "24/7", label: "AI Monitoring" },
                    { value: "5 min", label: "Setup Time" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-lg bg-white/10">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/70">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-sm text-white/80 italic">
                    "KrishiSayog helped me increase my rice yield by 40%. The AI recommendations are incredibly accurate."
                  </p>
                  <p className="text-xs text-white/60 mt-2">— Ramesh Kumar, Farmer, Maharashtra</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
