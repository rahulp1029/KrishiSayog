import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMarketListings } from "@/hooks/useMarketListings";
import { useMarketData } from "@/hooks/useMarketData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ShoppingBag, MapPin, TrendingUp, TrendingDown, Tag, User, ExternalLink, Tractor, Sprout, ShieldAlert, Wrench } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

const cropIcons: Record<string, string> = {
  "Rice": "🌾",
  "Wheat": "🌾",
  "Maize": "🌽",
  "Cotton": "☁️",
  "Tomato": "🍅",
  "Potato": "🥔",
};

const externalSupplies = [
  { id: 1, name: "Seeds & Saplings", icon: Sprout, query: "agricultural+seeds", desc: "High yield varieties for your next season." },
  { id: 2, name: "Fertilizers & Soil", icon: TrendingUp, query: "organic+fertilizer+agriculture", desc: "Organic and chemical options for soil health." },
  { id: 3, name: "Pest Control", icon: ShieldAlert, query: "agricultural+pesticide", desc: "Protect your crops from disease and insects." },
  { id: 4, name: "Tools & Machinery", icon: Tractor, query: "farming+tools+equipment", desc: "Tractors, tillers, and hand tools." },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { listings, loading: listingsLoading, addListing } = useMarketListings();
  const { prices } = useMarketData();
  const marketLoading = !prices || prices.length === 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [cropType, setCropType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to sell.", variant: "destructive" });
      return;
    }
    if (!cropType || !quantity || !price) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addListing({
        crop: cropType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        userId: user.id,
        userEmail: user.email,
        userName: user.name || 'Farmer',
      });
      toast({
        title: "Success",
        description: "Your product has been listed securely.",
      });
      setCropType("");
      setQuantity("");
      setPrice("");
    } catch (e) {
      const error = e as any;
      toast({ title: "Error", description: error.message || "Failed to post listing.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAmazonSearch = (query: string) => {
    window.open(`https://www.amazon.in/s?k=${query}`, '_blank');
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-bold font-heading">Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Commodity Exchange, Selling, and Supplies.
        </p>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="mb-6 bg-card border grid grid-cols-3 max-w-2xl">
          <TabsTrigger value="market" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Market Prices
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Sell Produce
          </TabsTrigger>
          <TabsTrigger value="buy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Buy Supplies
          </TabsTrigger>
        </TabsList>

        {/* --- Market Prices Tab --- */}
        <TabsContent value="market" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            {/* National Mandi Prices from IoT or Mock Hook */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Current Mandi Rates
              </h2>
              {marketLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                prices.map((item, i) => (
                  <Card key={i} className="card-shadow hover:-translate-y-1 transition-transform border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                          {cropIcons[item.crop] || "🍂"}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{item.crop}</p>
                          <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.mandi}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">₹{item.price}</p>
                        <p className={`text-xs font-semibold flex items-center justify-end gap-1 ${item.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                          {item.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {item.changePercent}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Live Farmer Listings from Firestore */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5 text-accent" /> Farmer Listings
              </h2>
              {listingsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
              ) : listings.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                  <p>No active farmer listings found.</p>
                </Card>
              ) : (
                listings.map((item) => (
                  <Card key={item.id} className="card-shadow border-l-4 border-l-accent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                          {cropIcons[item.crop] || "🌾"}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{item.crop} <span className="text-sm font-normal text-muted-foreground">({item.quantity} qtl)</span></p>
                          <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            <User className="h-3 w-3" /> {item.userName || item.userEmail?.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-primary">₹{item.price}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- Sell Produce Tab --- */}
        <TabsContent value="sell" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="max-w-2xl mx-auto card-shadow">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Post New Listing
              </CardTitle>
              <CardDescription>
                List your produce directly to buyers in the KrishiSayog network.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePostListing} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type</Label>
                  <Input 
                    id="cropType" 
                    placeholder="e.g. Rice, Wheat, Cotton..." 
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Available Quantity</Label>
                    <div className="relative">
                      <Input 
                        id="quantity" 
                        type="number"
                        placeholder="0" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        min="1"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">Quintals</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Expected Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">₹</span>
                      <Input 
                        id="price" 
                        type="number"
                        className="pl-8"
                        placeholder="0" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        min="1"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">/qtl</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full text-md h-12" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    "Post Listing to Marketplace"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Buy Supplies (External Connect) Tab --- */}
        <TabsContent value="buy" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {externalSupplies.map((supply) => {
                const Icon = supply.icon;
                return (
                <Card key={supply.id} className="card-shadow border-t-4 border-t-amber-500 hover:border-t-amber-600 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-amber-500" />
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">External Partner</span>
                    </div>
                    <CardTitle className="mt-4">{supply.name}</CardTitle>
                    <CardDescription>{supply.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 font-bold group border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                      onClick={() => openAmazonSearch(supply.query)}
                    >
                      Search on Amazon <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )})}
              
              <Card className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <Wrench className="h-10 w-10 mb-4 text-gray-400" />
                      <p className="font-semibold text-gray-700">Can't find what you need?</p>
                      <p className="text-sm mt-1">Our internal fulfillment network is under construction. For now, we connect you to trusted e-commerce platforms for immediate supply needs.</p>
                  </CardContent>
              </Card>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
