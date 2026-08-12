import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Clock } from "lucide-react";

export default function CareersPage() {
    const jobs = [
        { title: "Senior Agronomist", type: "Full-time", location: "Bangalore / Remote", dept: "Agricultural Science" },
        { title: "Machine Learning Engineer", type: "Full-time", location: "Remote", dept: "Engineering" },
        { title: "IoT Systems Architect", type: "Full-time", location: "Pune", dept: "Hardware" },
        { title: "Farmer Success Representative", type: "Contract", location: "Maharashtra", dept: "Operations" },
        { title: "Frontend Developer (React)", type: "Full-time", location: "Remote", dept: "Engineering" },
        { title: "Data Scientist - Climate Modeling", type: "Full-time", location: "Bangalore", dept: "Data & Research" },
    ];

    const benefits = [
        "Comprehensive health, dental, and vision insurance",
        "Flexible remote work policies and co-working stipends",
        "Generous annual learning and development budget",
        "Bi-annual company retreats (often at partner farms)",
        "Equipment stipend for your home office setup",
        "Meaningful equity/stock options in a growing startup"
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container max-w-5xl">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            Join the <span className="text-gradient-primary">Mission</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Help us build the software that feeds the world. We're looking for passionate individuals who want to make a real impact on global agriculture.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop"
                                alt="Team collaboration"
                                className="rounded-2xl card-shadow w-full h-80 object-cover"
                            />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
                            <h2 className="text-3xl font-bold font-heading mb-4">Our Culture</h2>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                                At KrishiSayog, we blend the fast-paced innovation of a tech startup with the grounded reality of farming. We believe in getting our boots dirty, understanding the end-user deeply, and shipping code that matters.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                We're not just building another SaaS tool; we're building the infrastructure for food security. Our team is composed of passionate engineers, scientists, and designers working closely with generational farmers.
                            </p>
                            <h3 className="font-bold mb-3">Why join us?</h3>
                            <ul className="space-y-2">
                                {benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px]">✓</span>
                                        </div>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <div className="bg-muted p-8 rounded-2xl mb-16 text-center">
                        <h2 className="text-2xl font-bold font-heading mb-4">Our Hiring Process</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                            {[
                                { step: "1", title: "Apply", desc: "Submit your resume and portfolio." },
                                { step: "2", title: "Review", desc: "We review your application within 48 hours." },
                                { step: "3", title: "Interview", desc: "Technical & cultural fit conversations." },
                                { step: "4", title: "Offer", desc: "Welcome to the KrishiSayog family!" }
                            ].map((phase) => (
                                <div key={phase.step} className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-3">
                                        {phase.step}
                                    </div>
                                    <h4 className="font-bold mb-1">{phase.title}</h4>
                                    <p className="text-sm text-muted-foreground">{phase.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold font-heading mb-6 border-b pb-4">Open Positions</h2>

                    <div className="space-y-4">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.dept}</div>
                                        <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</div>
                                        <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.type}</div>
                                    </div>
                                </div>
                                <Button>Apply Now</Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
