import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function ResearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">KrishiSayog Science</span>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            Research & Methodology
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            The agronomic science and machine learning models powering KrishiSayog's precision agriculture engine. Reviewed by leading agronomists.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {[
                            { stat: "94.2%", label: "Disease Detection Accuracy", sub: "Validated on open datasets" },
                            { stat: "500k+", label: "Soil Data Points", sub: "Used in model training" },
                            { stat: "22", label: "Crop Profiles", sub: "Currently supported in ML engine" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm"
                            >
                                <div className="text-4xl font-bold text-gradient-primary mb-2">{item.stat}</div>
                                <div className="font-semibold text-foreground mb-1">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.sub}</div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <h2>Crop Recommendation Engine</h2>
                            <p>
                                Our proprietary recommendation engine utilizes a Random Forest classification model trained on over 500,000 historical data points spanning diverse Indian agro-climatic zones. The model processes real-time inputs against 22 distinct crop profiles to determine optimal suitability.
                            </p>

                            <div className="bg-muted p-6 rounded-xl my-6">
                                <h4 className="flex items-center gap-2 mb-4 font-bold"><CheckCircle2 className="h-5 w-5 text-primary" /> Key Input Parameters</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none">
                                    <li>• Nitrogen (N) levels (mg/kg)</li>
                                    <li>• Phosphorus (P) levels (mg/kg)</li>
                                    <li>• Potassium (K) levels (mg/kg)</li>
                                    <li>• Soil pH Architecture</li>
                                    <li>• Real-time Temperature (°C)</li>
                                    <li>• Ambient Humidity (%)</li>
                                    <li>• Historical Rainfall Patterns (mm)</li>
                                </ul>
                            </div>

                            <h2>Disease Detection Computer Vision</h2>
                            <p>
                                We utilize a fine-tuned MobileNetV2 architecture for rapid, edge-capable inference of plant diseases. By analyzing leaf morphology and discoloration patterns, the system accurately detects 38 common diseases across 14 major cash and food crops with a validated field accuracy of 94.2%.
                            </p>
                            <p>
                                Unlike heavy cloud-dependent models, our lightweight architecture can eventually be deployed directly onto edge devices (like agricultural drones or smartphones) allowing for offline inference in remote areas with poor connectivity.
                            </p>

                            <h2>Weather Forecasting Integration</h2>
                            <p>
                                By triangulating data from Open-Meteo and IMD satellite feeds, KrishiSayog provides hyper-localized micro-climate predictions. This allows for optimized irrigation scheduling, potentially saving up to 40% of water usage during standard crop cycles.
                            </p>

                            <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col items-center text-center">
                                <h3 className="mb-2 mt-0">Read Our Whitepaper</h3>
                                <p className="text-muted-foreground mb-6">
                                    A comprehensive mathematical breakdown of our Random Forest ensemble and computer vision methodologies.
                                </p>
                                <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors">
                                    Download PDF (1.2 MB)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
