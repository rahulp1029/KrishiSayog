import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, Leaf, Wrench, Droplets } from "lucide-react";
import { motion } from "framer-motion";

export default function GuidesPage() {
    const guides = [
        { title: "Soil Preparation 101", icon: Leaf, desc: "Step-by-step guide to achieving the perfect NPK balance before sowing Kharif crops." },
        { title: "Water Management", icon: Droplets, desc: "How to read KrishiSayog weather forecasts to optimize your drip irrigation schedule." },
        { title: "Pest Recognition", icon: BookOpen, desc: "A visual guide to the top 10 most common pests in Indian agriculture and how to treat them." },
        { title: "Hardware Maintenance", icon: Wrench, desc: "Best practices for cleaning and calibrating your IoT soil sensors for maximum lifespan." },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container max-w-5xl">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            AI Farming <span className="text-gradient-primary">Guides</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Actionable, easy-to-understand guides designed to help you get the most out of your land using smart technology.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {guides.map((guide, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-8 rounded-2xl card-shadow group hover:card-shadow-hover transition-all cursor-pointer"
                            >
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                    <guide.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-2xl font-bold font-heading mb-3">{guide.title}</h3>
                                <p className="text-muted-foreground leading-relaxed mb-6">{guide.desc}</p>
                                <span className="text-primary font-semibold text-sm uppercase tracking-wide group-hover:underline">Read Guide &rarr;</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
