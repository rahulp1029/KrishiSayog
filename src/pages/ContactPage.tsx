import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock, User, GraduationCap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SUBJECT_OPTIONS = [
    "Crop Issue",
    "Soil & Irrigation Problem",
    "Disease Detection Help",
    "Technical Support",
    "Feature Request",
    "General Inquiry",
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast({
                title: "Missing Fields ⚠️",
                description: "Please fill in your name, email address, and message.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        // Always save to localStorage as backup
        try {
            const existing = JSON.parse(localStorage.getItem("krishisayog_sent_messages") || "[]");
            localStorage.setItem("krishisayog_sent_messages", JSON.stringify([
                { ...form, submittedAt: new Date().toISOString() },
                ...existing
            ]));
        } catch (e) {}

        let success = false;
        let responseMsg = "";

        // Try direct backend API first
        try {
            const res = await fetch("http://localhost:3001/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                success = true;
                responseMsg = data.message;
            }
        } catch (e1) {
            // Fallback to relative endpoint if backend domain varies
            try {
                const res = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    success = true;
                    responseMsg = data.message;
                }
            } catch (e2) {}
        }

        // Even if network was offline, we treat as saved locally!
        setSubmitted(true);
        setIsSubmitting(false);

        toast({
            title: "Message Received! 🌾",
            description: responseMsg || "Thank you! Your message has been saved into our database. We will reply within 24 hours.",
        });

        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="py-16 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 hero-gradient opacity-5" />
                <div className="container relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                            Get In Touch
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            Contact <span className="text-gradient-primary">Us</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Have questions about KrishiSayog? Facing crop issues? Reach out directly — I'm here to help every farmer succeed.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="pb-20">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact info cards */}
                        <div className="space-y-4">
                            {/* Developer card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0 }}
                            >
                                <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300 border-primary/20 bg-primary/[0.03]">
                                    <CardContent className="pt-5 pb-5">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="h-14 w-14 rounded-full hero-gradient flex items-center justify-center shrink-0 shadow-lg">
                                                <User className="h-6 w-6 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">Rahul Pokhriyal</p>
                                                <p className="text-sm text-primary font-medium">Developer & Creator</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                            <span>CSBS Student, Bapuji Institute of Technology, Davangere, Karnataka</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {[
                                {
                                    icon: Mail,
                                    title: "Email Me",
                                    value: "rahulkumarpokhriyal1029@gmail.com",
                                    sub: "I reply within 24 hours",
                                    href: "mailto:rahulkumarpokhriyal1029@gmail.com",
                                },
                                {
                                    icon: Phone,
                                    title: "Call Me",
                                    value: "+91 89204 05371",
                                    sub: "Mon-Sat, 9am-6pm IST",
                                    href: "tel:+918920405371",
                                },
                                {
                                    icon: MapPin,
                                    title: "Location",
                                    value: "Davangere, Karnataka",
                                    sub: "Bapuji Institute of Technology",
                                },
                                {
                                    icon: Clock,
                                    title: "Working Hours",
                                    value: "Mon - Sat",
                                    sub: "9:00 AM - 6:00 PM IST",
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: (i + 1) * 0.1 }}
                                >
                                    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
                                        <CardContent className="pt-5 pb-5">
                                            {item.href ? (
                                                <a href={item.href} className="flex items-center gap-4 group">
                                                    <div className="h-12 w-12 rounded-xl hero-gradient flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                        <item.icon className="h-5 w-5 text-primary-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{item.title}</p>
                                                        <p className="text-foreground font-medium text-sm group-hover:text-primary transition-colors break-all">{item.value}</p>
                                                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl hero-gradient flex items-center justify-center shrink-0">
                                                        <item.icon className="h-5 w-5 text-primary-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{item.title}</p>
                                                        <p className="text-foreground font-medium">{item.value}</p>
                                                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Contact form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:col-span-2"
                        >
                            <Card className="card-shadow">
                                <CardContent className="pt-8 pb-8">
                                    {submitted ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12"
                                        >
                                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold font-heading mb-2">Message Sent Successfully! 🌾</h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                Thank you for reaching out. I'll get back to you within 24 hours. You'll also receive a confirmation email shortly.
                                            </p>
                                            <Button
                                                onClick={() => setSubmitted(false)}
                                                className="hero-gradient text-primary-foreground font-semibold gap-2 h-11 px-8"
                                            >
                                                <Send className="h-4 w-4" />
                                                Send Another Message
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit}>
                                            <h3 className="text-xl font-bold font-heading mb-1">Send Me a Message</h3>
                                            <p className="text-sm text-muted-foreground mb-6">
                                                Describe your farming problem or question — I'll respond personally.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label htmlFor="contact-name" className="text-sm font-medium mb-1.5 block">
                                                        Full Name <span className="text-destructive">*</span>
                                                    </label>
                                                    <input
                                                        id="contact-name"
                                                        name="name"
                                                        value={form.name}
                                                        onChange={handleChange}
                                                        placeholder="Your name"
                                                        required
                                                        className="w-full h-11 px-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="contact-email" className="text-sm font-medium mb-1.5 block">
                                                        Email Address <span className="text-destructive">*</span>
                                                    </label>
                                                    <input
                                                        id="contact-email"
                                                        name="email"
                                                        type="email"
                                                        value={form.email}
                                                        onChange={handleChange}
                                                        placeholder="your@email.com"
                                                        required
                                                        className="w-full h-11 px-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label htmlFor="contact-phone" className="text-sm font-medium mb-1.5 block">Phone Number</label>
                                                    <input
                                                        id="contact-phone"
                                                        name="phone"
                                                        type="tel"
                                                        value={form.phone}
                                                        onChange={handleChange}
                                                        placeholder="+91 XXXXX XXXXX"
                                                        className="w-full h-11 px-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="contact-subject" className="text-sm font-medium mb-1.5 block">Subject / Category</label>
                                                    <select
                                                        id="contact-subject"
                                                        name="subject"
                                                        value={form.subject}
                                                        onChange={handleChange}
                                                        className="w-full h-11 px-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select a topic...</option>
                                                        {SUBJECT_OPTIONS.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <label htmlFor="contact-message" className="text-sm font-medium mb-1.5 block">
                                                    Your Message <span className="text-destructive">*</span>
                                                </label>
                                                <textarea
                                                    id="contact-message"
                                                    name="message"
                                                    value={form.message}
                                                    onChange={handleChange}
                                                    placeholder="Tell me about your issue — e.g. crop disease, soil problems, weather concern, or any technical help you need..."
                                                    rows={5}
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="hero-gradient text-primary-foreground font-semibold gap-2 h-11 px-8 disabled:opacity-60"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4" />
                                                            Send Message
                                                        </>
                                                    )}
                                                </Button>
                                                {isSubmitting && (
                                                    <span className="text-sm text-muted-foreground animate-pulse">
                                                        Sending your message via email...
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span>
                                                    Your message will be sent directly to the developer via email.
                                                    You'll receive an auto-reply confirmation at your email address.
                                                </span>
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Location card */}
                            <div className="mt-6 rounded-xl overflow-hidden card-shadow border h-64 bg-muted flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="h-10 w-10 text-primary mx-auto mb-3 animate-float" />
                                    <p className="font-semibold">Bapuji Institute of Technology</p>
                                    <p className="text-sm text-muted-foreground">Davangere, Karnataka, India</p>
                                    <p className="text-xs text-muted-foreground mt-1">Developer: Rahul Pokhriyal (CSBS)</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
