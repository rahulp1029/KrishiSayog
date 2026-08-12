import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Award, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { useMarketData } from "@/hooks/useMarketData";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-primary" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export default function MarketInsights() {
  const { prices, history, isLive, bestCrop, lastUpdated } = useMarketData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading">Market Insights</h1>
              <p className="text-muted-foreground text-sm">Track crop prices, market demand, and mandi rates across India.</p>
            </div>
          </div>
          <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} label="Prices Live" />
        </div>

        {/* Best crop to sell — now dynamic! */}
        {bestCrop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="card-shadow border-l-4 border-l-accent overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-2xl">
                    <Award className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-accent uppercase tracking-wide">Best Crop to Sell Now</p>
                    <p className="text-2xl font-bold font-heading">{bestCrop.crop}</p>
                    <p className="text-sm text-muted-foreground">{bestCrop.mandi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹<AnimatedNumber value={bestCrop.price} />
                    </p>
                    <p className="text-xs text-muted-foreground">per quintal</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${bestCrop.trend === "up" ? "text-primary" : bestCrop.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                    {bestCrop.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : bestCrop.trend === "down" ? <ArrowDownRight className="h-4 w-4" /> : null}
                    {bestCrop.changePercent > 0 ? "+" : ""}{bestCrop.changePercent}%
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Historical Price Trends (₹/quintal)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="rice" stroke="hsl(122, 45%, 33%)" strokeWidth={2} name="Rice" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="wheat" stroke="hsl(36, 100%, 50%)" strokeWidth={2} name="Wheat" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cotton" stroke="hsl(122, 35%, 56%)" strokeWidth={2} name="Cotton" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Live Crop Demand Index</CardTitle>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={prices.map(p => ({ crop: p.crop, demand: Math.round(50 + p.price / 150) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="crop" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="demand" fill="hsl(122, 45%, 33%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Live mandi prices table */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Live Mandi Price Comparison</CardTitle>
              <LiveIndicator isLive={isLive} lastUpdated={lastUpdated} label="Live" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold">Crop</th>
                    <th className="pb-3 font-semibold">Mandi</th>
                    <th className="pb-3 font-semibold">Price (₹/quintal)</th>
                    <th className="pb-3 font-semibold">Change</th>
                    <th className="pb-3 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((item) => (
                    <tr key={item.crop} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{item.crop}</td>
                      <td className="py-3 text-muted-foreground">{item.mandi}</td>
                      <td className="py-3 font-bold">
                        ₹<AnimatedNumber value={item.price} />
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.trend === "up" ? "bg-primary/10 text-primary" :
                            item.trend === "down" ? "bg-destructive/10 text-destructive" :
                              "bg-muted text-muted-foreground"
                          }`}>
                          {item.change > 0 ? "+" : ""}{item.change} ({item.changePercent > 0 ? "+" : ""}{item.changePercent}%)
                        </span>
                      </td>
                      <td className="py-3"><TrendIcon trend={item.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
