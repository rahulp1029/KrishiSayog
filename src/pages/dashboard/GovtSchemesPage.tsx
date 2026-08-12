import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, IndianRupee, Sprout, Droplets, Shield, BarChart3, Leaf, Search } from "lucide-react";
import { useState } from "react";

const schemes = [
  {
    id: "pmkisan",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    category: "Income Support",
    icon: IndianRupee,
    amount: "₹6,000/year",
    color: "bg-green-50 border-green-200",
    badgeColor: "default" as const,
    beneficiaries: "11+ Crore farmers",
    description: "Direct income support of ₹6,000 per year paid in three equal installments to small and marginal landholder farmer families.",
    eligibility: ["Small and marginal farmers", "Landholding up to 2 hectares", "Aadhaar linked bank account required"],
    howToApply: "Apply at your local CSC (Common Service Centre) or PM-KISAN portal with Aadhaar, land records, and bank details.",
    link: "https://pmkisan.gov.in",
  },
  {
    id: "pmfby",
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana",
    category: "Crop Insurance",
    icon: Shield,
    amount: "Up to 90% claim",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "secondary" as const,
    beneficiaries: "5+ Crore farmers",
    description: "Comprehensive crop insurance providing financial support to farmers when their crops are damaged due to unforeseen events like natural calamities, pests, or diseases.",
    eligibility: ["All farmers growing notified crops", "Farmers with crop loans (compulsory)", "Voluntary for non-loanee farmers"],
    howToApply: "Apply through your nearest bank, cooperative, or CSC before the cutoff date for each season.",
    link: "https://pmfby.gov.in",
  },
  {
    id: "soilhealthcard",
    name: "Soil Health Card",
    fullName: "Soil Health Card Scheme",
    category: "Soil Management",
    icon: Leaf,
    amount: "Free",
    color: "bg-yellow-50 border-yellow-200",
    badgeColor: "secondary" as const,
    beneficiaries: "22+ Crore cards issued",
    description: "Free soil testing and personalized fertiliser recommendations based on your specific land. Helps optimize inputs and reduce costs.",
    eligibility: ["All farmers with agricultural land", "Card issued every 2 years"],
    howToApply: "Contact your local Krishi Vigyan Kendra (KVK) or agricultural department office. Submit a soil sample from your field.",
    link: "https://soilhealth.dac.gov.in",
  },
  {
    id: "pmksy",
    name: "PMKSY",
    fullName: "Pradhan Mantri Krishi Sinchai Yojana",
    category: "Irrigation",
    icon: Droplets,
    amount: "Up to 55% subsidy",
    color: "bg-cyan-50 border-cyan-200",
    badgeColor: "secondary" as const,
    beneficiaries: "Farmers in 99 irrigation districts",
    description: "Promotes water-efficient irrigation including drip and sprinkler systems. Subsidy of up to 45% for general category and 55% for SC/ST farmers.",
    eligibility: ["Any farmer with agricultural land", "Higher subsidy for SC/ST farmers", "Must install approved drip/sprinkler system"],
    howToApply: "Apply through your state agriculture or horticulture department. Installation must be done by an empanelled vendor.",
    link: "https://pmksy.gov.in",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card",
    fullName: "Kisan Credit Card Scheme",
    category: "Credit",
    icon: BarChart3,
    amount: "Up to ₹3 Lakh @ 4%",
    color: "bg-purple-50 border-purple-200",
    badgeColor: "secondary" as const,
    beneficiaries: "7+ Crore card holders",
    description: "Short-term credit for crop cultivation, post-harvest expenses, and allied agricultural activities at concessional interest rates of 4% per year.",
    eligibility: ["All farmers, tenant farmers", "Self-help groups", "Joint liability groups of farmers"],
    howToApply: "Apply at any nationalised bank, cooperative bank, or regional rural bank with land records, ID proof, and two passport photos.",
    link: "https://www.nabard.org",
  },
  {
    id: "enam",
    name: "eNAM",
    fullName: "Electronic National Agriculture Market",
    category: "Marketing",
    icon: BarChart3,
    amount: "Better prices",
    color: "bg-orange-50 border-orange-200",
    badgeColor: "secondary" as const,
    beneficiaries: "2+ Crore registered farmers",
    description: "Pan-India electronic trading portal that creates a unified national market for agricultural commodities. Get live prices and sell directly online.",
    eligibility: ["Any farmer with a registered APMC market", "Linked bank account", "Mobile number for OTP"],
    howToApply: "Register at enam.gov.in with your APMC license number, bank details, and Aadhaar.",
    link: "https://enam.gov.in",
  },
];

const categories = ["All", "Income Support", "Crop Insurance", "Soil Management", "Irrigation", "Credit", "Marketing"];

export default function GovtSchemesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = schemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Government Schemes
        </h1>
        <p className="text-muted-foreground text-sm">Central government agricultural welfare programs you may be eligible for</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Schemes", value: "6" },
          { label: "Total Beneficiaries", value: "45 Cr+" },
          { label: "Annual Outlay", value: "₹1.5 Lakh Cr" },
        ].map(stat => (
          <Card key={stat.label} className="card-shadow text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(scheme => (
          <Card
            key={scheme.id}
            className={`card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer border ${scheme.color} ${selected === scheme.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelected(selected === scheme.id ? null : scheme.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                    <scheme.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{scheme.name}</CardTitle>
                      <Badge variant={scheme.badgeColor} className="text-[10px]">{scheme.category}</Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5">{scheme.fullName}</CardDescription>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{scheme.amount}</p>
                  <p className="text-[10px] text-muted-foreground">{scheme.beneficiaries}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{scheme.description}</p>

              {selected === scheme.id && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-2">Eligibility</p>
                    {scheme.eligibility.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground mb-1">• {e}</p>
                    ))}
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">How to Apply</p>
                    <p className="text-xs text-muted-foreground">{scheme.howToApply}</p>
                  </div>
                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" /> Official Portal
                  </a>
                </div>
              )}

              <p className="text-xs text-primary/60 mt-3 font-medium">
                {selected === scheme.id ? "▲ Collapse" : "▼ View eligibility & how to apply"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
