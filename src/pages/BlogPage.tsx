import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight } from "lucide-react";

export default function BlogPage() {
    const posts = [
        {
            title: "How AI is Revolutionizing Precision Farming in India",
            category: "Technology",
            date: "Oct 12, 2026",
            author: "Dr. Ananya Sharma",
            excerpt: "Discover how machine learning algorithms are helping farmers optimize their yield and reduce water consumption by up to 30%.",
            image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2938&auto=format&fit=crop"
        },
        {
            title: "Understanding Soil Health Metrics for Maximum Yield",
            category: "Agronomy",
            date: "Sep 28, 2026",
            author: "Vikram Singh",
            excerpt: "A deep dive into NPK values, pH levels, and how continuous soil monitoring can prevent crop failure before it starts.",
            image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2940&auto=format&fit=crop"
        },
        {
            title: "The Future of IoT Sensors in Rural Agriculture",
            category: "Hardware",
            date: "Sep 15, 2026",
            author: "Raj Patel",
            excerpt: "Affordable ESP32-based sensors are making real-time farm data accessible to smallholder farmers for the first time.",
            image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2940&auto=format&fit=crop"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            KrishiSayog <span className="text-gradient-primary">Blog</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Insights, tutorials, and updates from the intersection of agriculture and artificial intelligence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="bg-card rounded-2xl overflow-hidden card-shadow group cursor-pointer hover:card-shadow-hover transition-all"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <div className="absolute top-4 left-4 z-10 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                        {post.category}
                                    </div>
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {post.author}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold font-heading mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                                        Read Article <ArrowRight className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
