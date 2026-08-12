import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, Code, Terminal, Server } from "lucide-react";
import { motion } from "framer-motion";

export default function DocumentationPage() {
    const categories = [
        { icon: BookOpen, title: "Getting Started", desc: "A beginner's guide to setting up your KrishiSayog dashboard and understanding the core features." },
        { icon: Terminal, title: "Hardware Setup", desc: "Detailed hardware diagrams and firmware flashing instructions for ESP32 and soil sensors." },
        { icon: Code, title: "Software Integration", desc: "How to interpret NPK values, utilize the crop recommendation engine, and set alerts." },
        { icon: Server, title: "Data Architecture", desc: "Understanding how your farming data is secured, stored, and processed via MQTT and Firebase." },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container max-w-6xl">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">KrishiSayog Docs</span>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            Platform <span className="text-gradient-primary">Documentation</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Comprehensive guides and documentation to help you start working with KrishiSayog quickly and effectively.
                        </p>
                        <div className="mt-8 relative max-w-xl mx-auto">
                            <input
                                type="text"
                                placeholder="Search documentation... (e.g. 'setup ESP32', 'NPK values')"
                                className="w-full h-12 pl-12 pr-4 rounded-full border border-border bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <cat.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
                                <p className="text-muted-foreground text-sm flex-1">{cat.desc}</p>
                                <div className="mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Explore &rarr;
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 border-r border-border pr-6 hidden md:block">
                            <h3 className="font-bold mb-4 px-2">Table of Contents</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li><a href="#" className="block px-2 py-1.5 rounded-md text-primary font-medium bg-primary/5">Quick Start Guide</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Sensor Calibration</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Understanding NPK Limits</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Connecting to WiFi</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Setting up Alerts</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Data Export Formats</a></li>
                                <li><a href="#" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Troubleshooting FAQ</a></li>
                            </ul>
                        </div>
                        <div className="lg:col-span-2 prose prose-slate dark:prose-invert max-w-none">
                            <h2>Quick Start Guide</h2>
                            <p>
                                Welcome to KrishiSayog! This guide will walk you through the very basics of getting your farm connected to our platform.
                            </p>

                            <h3>1. Create your account</h3>
                            <p>
                                If you haven't already, sign up for a KrishiSayog account. You can use your Google or GitHub account for quick access. Upon logging in, you'll be greeted by your dashboard.
                            </p>

                            <h3>2. Configure your location</h3>
                            <p>
                                Our application uses your browser's location to automatically fetch highly accurate, hyper-localized weather data. Ensure you click "Allow" when the browser prompts you for location access.
                            </p>
                            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-md my-4">
                                <p className="text-amber-700 dark:text-amber-400 m-0 text-sm">
                                    <strong>Note:</strong> If you deny location access, the system will default to displaying weather data for Nashik, Maharashtra.
                                </p>
                            </div>

                            <h3>3. Input Soil Data</h3>
                            <p>
                                To get accurate AI crop recommendations, you need to input your soil telemetry. If you don't have our automated IoT sensors yet, you can manually enter values obtained from a local soil testing laboratory. Head over to <strong>Dashboard &gt; Soil Data</strong> to enter:
                            </p>
                            <ul>
                                <li>Nitrogen (N)</li>
                                <li>Phosphorus (P)</li>
                                <li>Potassium (K)</li>
                                <li>pH Level</li>
                            </ul>

                            <h3>4. View Recommendations</h3>
                            <p>
                                Once your soil data is uploaded and weather data is detected, our Machine Learning engine automatically runs inferences in the background. Navigate to <strong>Dashboard &gt; Crop Recommendations</strong> to view the top suitable crops for your specific micro-climate and soil profile.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
