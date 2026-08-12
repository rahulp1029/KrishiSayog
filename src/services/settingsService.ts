export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    avatar?: string;
}

export interface FarmConfig {
    farmName: string;
    totalArea: string;
    areaUnit: "Acres" | "Hectares" | "Bigha";
    soilType: string;
    primaryCrops: string;
}

export interface NotificationPreferences {
    moistureAlerts: boolean;
    weatherAlerts: boolean;
    pestAlerts: boolean;
    marketUpdates: boolean;
    weeklyReport: boolean;
    smsAlerts: boolean;
}

export interface UserSettings {
    profile: UserProfile;
    farm: FarmConfig;
    notifications: NotificationPreferences;
    isProfileComplete: boolean;
    lastSaved?: string;
}

const STORAGE_KEY = "krishisayog_user_settings_v1";

const DEFAULT_SETTINGS: UserSettings = {
    profile: {
        name: "Rahul Pokhriyal",
        email: "rahul@krishisayog.app",
        phone: "+91 9876543210",
        location: "Nashik, Maharashtra, India",
    },
    farm: {
        farmName: "Green Harvest Organic Farm",
        totalArea: "5.5",
        areaUnit: "Acres",
        soilType: "Black Clay Soil (Regur)",
        primaryCrops: "Wheat, Tomatoes, Grapes, Onions",
    },
    notifications: {
        moistureAlerts: true,
        weatherAlerts: true,
        pestAlerts: true,
        marketUpdates: false,
        weeklyReport: true,
        smsAlerts: true,
    },
    isProfileComplete: true,
    lastSaved: new Date().toISOString(),
};

export function loadUserSettings(): UserSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
                farm: { ...DEFAULT_SETTINGS.farm, ...parsed.farm },
                notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
            };
        }
    } catch (err) {
        console.error("Failed to load user settings from localStorage", err);
    }
    return DEFAULT_SETTINGS;
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
    const current = loadUserSettings();
    const updated: UserSettings = {
        ...current,
        ...settings,
        profile: { ...current.profile, ...(settings.profile || {}) },
        farm: { ...current.farm, ...(settings.farm || {}) },
        notifications: { ...current.notifications, ...(settings.notifications || {}) },
        isProfileComplete: true,
        lastSaved: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
        console.error("Failed to save user settings to localStorage", err);
    }

    return updated;
}
