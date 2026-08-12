import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer, ArrowLeft, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ComingSoonPage() {
    const location = useLocation();

    // Capitalize and format the path name for display
    const pageName = location.pathname
        .replace("/", "")
        .replace("-", " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "This Feature";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    <div className="flex justify-center mb-8">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center relative">
                            <Timer className="h-10 w-10 text-primary absolute" />
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary animate-spin" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold font-heading">
                        <span className="text-gradient-primary">{pageName}</span>
                    </h1>

                    <h2 className="text-2xl font-semibold mt-2">Coming Soon!</h2>

                    <p className="text-muted-foreground leading-relaxed mt-4">
                        We're currently working hard on building this section of KrishiSayog.
                        Check back soon for updates to our AI-powered farming platform.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild variant="default" className="gap-2">
                            <Link to="/">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="gap-2">
                            <Link to="/dashboard">
                                <Sprout className="h-4 w-4" />
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
