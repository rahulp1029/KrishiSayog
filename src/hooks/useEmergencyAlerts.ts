import { useState, useEffect, useCallback, useRef } from "react";
import { EmergencyAlert } from "@/types/emergencyAlert";
import { WeatherData } from "@/types/weather";
import { SensorReading } from "@/services/iotConfig";
import { 
    fetchEmergencyAlerts, 
    getNotifiedAlertIds, 
    markAlertAsNotified, 
    createAlertFingerprint 
} from "@/services/alertService";
import { sendEmergencyNotification, requestNotificationPermission } from "@/services/notificationService";
import { playEmergencyAlertSound } from "@/services/audioAlertService";

interface UseEmergencyAlertsProps {
    locationName?: string;
    weatherData?: WeatherData | null;
    sensorData?: Partial<SensorReading> | null;
}

export function useEmergencyAlerts({ locationName = "Nashik, Maharashtra", weatherData, sensorData }: UseEmergencyAlertsProps = {}) {
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<NotificationPermission>(
        typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
    );

    // Keep stable refs to prevent cyclic useEffect triggers
    const locationRef = useRef(locationName);
    const weatherRef = useRef(weatherData);
    const sensorRef = useRef(sensorData);
    const alertsRef = useRef(alerts);

    useEffect(() => {
        locationRef.current = locationName;
        weatherRef.current = weatherData;
        sensorRef.current = sensorData;
        alertsRef.current = alerts;
    });

    const loadAlerts = useCallback(async () => {
        try {
            const fetched = await fetchEmergencyAlerts(
                locationRef.current, 
                weatherRef.current, 
                sensorRef.current
            );
            
            // Filter out expired alerts
            const now = new Date().getTime();
            const validAlerts = fetched.filter(a => {
                if (!a.expiresAt) return true;
                const exp = new Date(a.expiresAt).getTime();
                return isNaN(exp) || exp > now;
            });

            setAlerts(validAlerts);

            // Handle alert notifications for un-notified CRITICAL / SEVERE alerts
            const notifiedIds = getNotifiedAlertIds();
            for (const alert of validAlerts) {
                const fingerprint = createAlertFingerprint(alert);
                if (!notifiedIds.includes(fingerprint)) {
                    if (alert.severity === "CRITICAL" || alert.severity === "SEVERE" || alert.severity === "WARNING") {
                        sendEmergencyNotification(alert);
                        if (alert.severity === "CRITICAL" || alert.severity === "SEVERE") {
                            playEmergencyAlertSound(alert.severity);
                        }
                    }
                    markAlertAsNotified(fingerprint);
                }
            }
        } catch (err) {
            console.warn("Emergency alert fetch failed:", err);
            setError("Failed to fetch emergency advisories");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount or when location changes
    useEffect(() => {
        loadAlerts();

        // Polling interval: 5 mins if severe alert active, else 15 mins
        const hasSevere = alertsRef.current.some(a => a.severity === "CRITICAL" || a.severity === "SEVERE");
        const pollMs = hasSevere ? 300000 : 900000;

        const interval = setInterval(() => {
            loadAlerts();
        }, pollMs);

        return () => clearInterval(interval);
    }, [locationName, loadAlerts]);

    const requestPermission = async () => {
        const perm = await requestNotificationPermission();
        setPermissionState(perm);
        return perm;
    };

    const activeCriticalAlerts = alerts.filter(a => a.severity === "CRITICAL" || a.severity === "SEVERE");

    return {
        alerts,
        activeCriticalAlerts,
        loading,
        error,
        permissionState,
        requestPermission,
        refresh: loadAlerts
    };
}
