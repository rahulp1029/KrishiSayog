import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, Github } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
    const { signInWithGoogle, signInWithGithub, loginAsDemo, isLoading } = useAuth();

    const handleGoogleLogin = () => {
        signInWithGoogle();
    };

    const handleGithubLogin = () => {
        signInWithGithub();
    };

    const handleDemoLogin = () => {
        loginAsDemo();
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side — background image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
                <div className="absolute inset-0 opacity-20">
                    {/* Decorative floating elements */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-white/10"
                            style={{
                                width: 60 + i * 30,
                                height: 60 + i * 30,
                                left: `${15 + i * 12}%`,
                                top: `${10 + i * 14}%`,
                            }}
                            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                        />
                    ))}
                </div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <Sprout className="h-10 w-10" />
                            <span className="text-3xl font-bold font-heading">KrishiSayog</span>
                        </div>
                        <h1 className="text-4xl font-bold font-heading leading-tight mb-4">
                            AI-Powered Farming Intelligence
                        </h1>
                        <p className="text-lg text-white/80 max-w-md leading-relaxed">
                            Join thousands of farmers making smarter decisions with soil data, weather predictions, and AI crop recommendations.
                        </p>
                        <div className="mt-8 flex gap-4">
                            <div className="glass rounded-lg px-4 py-3 text-center">
                                <p className="text-2xl font-bold">10K+</p>
                                <p className="text-xs text-white/70">Farmers</p>
                            </div>
                            <div className="glass rounded-lg px-4 py-3 text-center">
                                <p className="text-2xl font-bold">98%</p>
                                <p className="text-xs text-white/70">Accuracy</p>
                            </div>
                            <div className="glass rounded-lg px-4 py-3 text-center">
                                <p className="text-2xl font-bold">50+</p>
                                <p className="text-xs text-white/70">Crops</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right side — login form */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md flex flex-col items-center"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <Sprout className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold text-gradient-primary font-heading">KrishiSayog</span>
                    </div>

                    <div className="text-center mb-10 w-full">
                        <h2 className="text-3xl font-bold font-heading mb-2">Welcome</h2>
                        <p className="text-muted-foreground">Sign in to access your smart farming dashboard</p>
                    </div>

                    <Card className="w-full card-shadow border-primary/10">
                        <CardContent className="pt-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-background">
                                <Sprout className="h-6 w-6 text-primary" />
                            </div>

                            <div className="pt-4 flex flex-col gap-4">
                                <Button onClick={handleGoogleLogin} type="button" variant="outline" className="w-full h-12 text-sm font-medium gap-3 hover:bg-slate-50 transition-colors shadow-sm" disabled={isLoading}>
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </Button>

                                <Button onClick={handleGithubLogin} type="button" variant="outline" className="w-full h-12 text-sm font-medium gap-3 hover:bg-slate-50 transition-colors shadow-sm" disabled={isLoading}>
                                    <Github className="h-5 w-5" />
                                    Continue with GitHub
                                </Button>

                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <Button onClick={handleDemoLogin} type="button" className="w-full h-12 text-sm font-semibold gap-2 hero-gradient text-primary-foreground shadow-md hover:opacity-90 transition-opacity" disabled={isLoading}>
                                    <Sprout className="h-5 w-5" />
                                    Instant Farmer Access (One-Click)
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4 pt-4 border-t border-border">
                                    By signing in, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
