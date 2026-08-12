import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Target, Lightbulb, Users, Globe, Award, TrendingUp } from "lucide-react";

const teamMembers = [
    { name: "Rahul Pokhriyal", role: "Lead Developer & Co-Founder", desc: "Full-stack engineer driving the core KrishiSayog platform.", image: "/team/rahul.jpg" },
    { name: "Praveen", role: "Frontend Developer", desc: "UI/UX specialist making tech farmer-friendly and accessible.", image: "/team/praveen.jpg" },
    { name: "Dhruva Bharadwaj", role: "AI/ML Engineer", desc: "Expert in crop recommendation engines and data models.", image: "/team/dhruva.jpg" },
    { name: "Naveen", role: "Backend Developer", desc: "Architecting robust APIs and IoT sensor integrations.", image: "/team/naveen.jpg" },
];

const stats = [
    { value: "10,000+", label: "Active Farmers", icon: Users },
    { value: "50+", label: "Crops Supported", icon: Globe },
    { value: "98%", label: "AI Accuracy", icon: Award },
    { value: "35%", label: "Yield Increase", icon: TrendingUp },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="relative overflow-hidden py-20 md:py-28">
                <div className="absolute inset-0 hero-gradient opacity-5" />
                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                            About KrishiSayog
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                            Empowering Farmers with{" "}
                            <span className="text-gradient-primary">AI Technology</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We're on a mission to transform agriculture through technology, making smart farming accessible to every farmer across India.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 section-alt">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
                                    <Target className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold font-heading">Our Mission</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                To use cutting-edge AI and IoT technology to empower farmers and dramatically improve agricultural productivity across India. We believe every farmer deserves access to the same data-driven insights used by the world's most advanced agricultural operations.
                            </p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                                    <Lightbulb className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold font-heading">Our Vision</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                A world where no farmer has to guess. Where soil health, weather patterns, and market dynamics are all available at their fingertips — empowering smarter decisions, higher yields, and sustainable livelihoods.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="rounded-2xl overflow-hidden card-shadow bg-card p-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {stats.map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1, duration: 0.4 }}
                                            className="bg-muted rounded-xl p-5 text-center group hover:bg-primary/5 transition-colors"
                                        >
                                            <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                                            <p className="text-2xl font-bold font-heading">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-primary/10 animate-pulse-grow" />
                            <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-accent/10 animate-float" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20">
                <div className="container">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            Meet Our <span className="text-gradient-primary">Team</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Passionate individuals combining agriculture expertise with cutting-edge technology.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="bg-card rounded-xl p-6 card-shadow text-center group hover:card-shadow-hover transition-all duration-300 flex flex-col items-center"
                            >
                                <div className="h-24 w-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-emerald-500/30 shadow-md group-hover:scale-105 group-hover:border-emerald-500 transition-all duration-300 relative bg-emerald-100 flex items-center justify-center">
                                    {member.image ? (
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                // Fallback to initial if image fails
                                                (e.target as HTMLElement).style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-emerald-800">
                                            {member.name.split(" ").map(n => n[0]).join("")}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-lg">{member.name}</h3>
                                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{member.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Innovation timeline */}
            <section className="py-16 section-alt">
                <div className="container">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold font-heading mb-4">
                            Our <span className="text-gradient-primary">Journey</span>
                        </h2>
                    </div>
                    <div className="max-w-3xl mx-auto space-y-6">
                        {[
                            { year: "2026", title: "Inception & Ideation", desc: "The vision for KrishiSayog was born out of a shared passion to solve real-world agricultural challenges using advanced AI." },
                            { year: "2027", title: "Platform Development", desc: "Building the core technology, from predictive crop recommendation engines to real-time weather integration." },
                            { year: "2028", title: "Beta Launch", desc: "We anticipate releasing our pilot platform to early adopters, gathering crucial feedback from local farming communities." },
                            { year: "2029", title: "Future Expansion", desc: "Our ultimate goal is to reach and empower farmers across all of India with localized data and precision farming tools." },
                        ].map((item, i) => (
                            <motion.div
                                key={item.year}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-4 items-start"
                            >
                                <div className="shrink-0 w-16 h-16 rounded-xl hero-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                                    {item.year}
                                </div>
                                <div className="bg-card rounded-xl p-4 card-shadow flex-1">
                                    <h3 className="font-semibold mb-1">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
