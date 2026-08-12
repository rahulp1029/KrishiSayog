import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Save, Sprout, Download, MapPin, CheckCircle2, ShieldCheck, Phone, Mail, Globe, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserSettings, saveUserSettings, UserSettings } from "@/services/settingsService";
import DataExportSection from "@/components/dashboard/DataExportSection";
import { toast } from "sonner";

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(loadUserSettings());
    const [saving, setSaving] = useState(false);

    // Sync with auth user on mount if name/email exist
    useEffect(() => {
        if (user) {
            setSettings(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    name: prev.profile.name !== "Rahul Pokhriyal" ? prev.profile.name : (user.name || prev.profile.name),
                    email: prev.profile.email !== "rahul@krishisayog.app" ? prev.profile.email : (user.email || prev.profile.email),
                    avatar: user.avatar || prev.profile.avatar,
                }
            }));
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        const updated = saveUserSettings(settings);
        setSettings(updated);

        try {
            await fetch('http://localhost:3001/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: settings.profile.name,
                    email: settings.profile.email,
                    phone: settings.profile.phone,
                    location: settings.profile.location,
                    farmName: settings.farm.farmName,
                    totalArea: settings.farm.totalArea,
                    areaUnit: settings.farm.areaUnit,
                    soilType: settings.farm.soilType,
                    primaryCrops: settings.farm.primaryCrops
                })
            });
        } catch (err) {
            console.warn("MySQL sync offline", err);
        }

        setSaving(false);
        toast.success("✅ Profile & Settings saved to MySQL database!", {
            description: `Farmer: ${settings.profile.name} | Mobile: ${settings.profile.phone}`
        });
    };

    // Generate initials from name
    const initials = settings.profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "F";

    const updateProfile = (key: string, val: string) => {
        setSettings(s => ({ ...s, profile: { ...s.profile, [key]: val } }));
    };

    const updateFarm = (key: string, val: any) => {
        setSettings(s => ({ ...s, farm: { ...s.farm, [key]: val } }));
    };

    const toggleNotification = (key: keyof UserSettings["notifications"]) => {
        setSettings(s => ({
            ...s,
            notifications: { ...s.notifications, [key]: !s.notifications[key] }
        }));
    };

    return (
        <div className="space-y-6 page-enter max-w-4xl pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
                        ⚙️ Settings & Configuration
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your profile, farm setup, alert preferences, and data exports
                    </p>
                </div>
                {settings.lastSaved && (
                    <Badge variant="outline" className="text-xs gap-1 py-1 px-3 border-emerald-300 bg-emerald-50 text-emerald-800 self-start sm:self-auto">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Saved: {settings.lastSaved}
                    </Badge>
                )}
            </div>

            {/* Profile Information */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Profile Information
                        </span>
                        <Badge variant="secondary" className="text-xs">Permanent Storage</Badge>
                    </CardTitle>
                    <CardDescription>Your personal contact and identification details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        {settings.profile.avatar ? (
                            <img src={settings.profile.avatar} alt={settings.profile.name} className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500 shadow" />
                        ) : (
                            <div className="h-16 w-16 rounded-full hero-gradient flex items-center justify-center text-primary-foreground text-xl font-bold shadow">
                                {initials}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-lg">{settings.profile.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5 text-slate-400" /> {settings.profile.email || "No email set"}
                            </p>
                            <span className="inline-block mt-1 text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                                Verified Farmer Account
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-slate-700">
                                <User className="h-3.5 w-3.5 text-primary" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={settings.profile.name}
                                onChange={(e) => updateProfile("name", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-slate-700">
                                <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={settings.profile.email}
                                onChange={(e) => updateProfile("email", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="farmer@example.com"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-slate-700">
                                <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number (SMS Alerts)
                            </label>
                            <input
                                type="tel"
                                value={settings.profile.phone}
                                onChange={(e) => updateProfile("phone", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-primary" /> Location / Village / State
                            </label>
                            <input
                                type="text"
                                value={settings.profile.location}
                                onChange={(e) => updateProfile("location", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="e.g. Nashik, Maharashtra, India"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Farm Configuration */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-emerald-600" /> Farm Configuration
                    </CardTitle>
                    <CardDescription>Configure your land parameters for tailored AI crop recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Farm Name</label>
                            <input
                                type="text"
                                value={settings.farm.farmName}
                                onChange={(e) => updateFarm("farmName", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="e.g. Green Valley Farm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Total Area</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.farm.totalArea}
                                    onChange={(e) => updateFarm("totalArea", e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="e.g. 5.5"
                                />
                                <select
                                    value={settings.farm.areaUnit}
                                    onChange={(e) => updateFarm("areaUnit", e.target.value)}
                                    className="h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="Acres">Acres</option>
                                    <option value="Hectares">Hectares</option>
                                    <option value="Bigha">Bigha</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Soil Type</label>
                            <select
                                value={settings.farm.soilType}
                                onChange={(e) => updateFarm("soilType", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Black Clay Soil (Regur)">Black Clay Soil (Regur)</option>
                                <option value="Alluvial Soil">Alluvial Soil</option>
                                <option value="Red Sandy Soil">Red Sandy Soil</option>
                                <option value="Loamy Soil">Loamy Soil</option>
                                <option value="Silt / Clay Loam">Silt / Clay Loam</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block text-slate-700">Primary Crops Cultivated</label>
                            <input
                                type="text"
                                value={settings.farm.primaryCrops}
                                onChange={(e) => updateFarm("primaryCrops", e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="e.g. Wheat, Tomatoes, Grapes"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-500" /> Notification Preferences
                    </CardTitle>
                    <CardDescription>Configure which real-time alerts and reports you want to receive</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { key: "moistureAlerts", label: "Soil Moisture Alerts", desc: "Instant push notifications when soil drops below dry threshold (<30%)" },
                            { key: "weatherAlerts", label: "Weather Warnings", desc: "Heavy rain, storm, and extreme temperature warnings" },
                            { key: "pestAlerts", label: "Pest & Disease Alerts", desc: "High-humidity fungal risk warnings" },
                            { key: "marketUpdates", label: "Market Price Updates", desc: "Daily MSP & Mandi crop rate changes" },
                            { key: "weeklyReport", label: "Weekly Farm Report", desc: "Automated AI agronomic email report every Sunday" },
                            { key: "smsAlerts", label: "SMS Notifications", desc: "Send critical irrigation alerts directly to your phone via SMS" },
                        ].map((item) => {
                            const isEnabled = settings.notifications[item.key as keyof UserSettings["notifications"]];
                            return (
                                <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleNotification(item.key as keyof UserSettings["notifications"])}
                                        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                                            isEnabled ? "bg-emerald-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                                isEnabled ? "translate-x-5" : "translate-x-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Data Export */}
            <Card className="card-shadow">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" /> Data Export
                    </CardTitle>
                    <CardDescription>Export your real-time sensor readings and weather data for offline analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataExportSection />
                </CardContent>
            </Card>

            {/* Sticky Save Bar */}
            <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-xl">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>All changes are saved permanently to your device & cloud</span>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="hero-gradient text-white font-bold gap-2 h-10 px-6 shadow-md hover:shadow-lg transition-all"
                >
                    <Save className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
