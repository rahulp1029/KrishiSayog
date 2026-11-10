import { EmergencyAlert } from "@/types/emergencyAlert";

export function isNotificationSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) {
        return "denied";
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (e) {
        console.warn("Notification permission request failed", e);
        return "denied";
    }
}

export function sendEmergencyNotification(alert: EmergencyAlert): void {
    if (!isNotificationSupported() || Notification.permission !== "granted") {
        return;
    }

    const icon = alert.severity === "CRITICAL" || alert.severity === "SEVERE" ? "🚨" : "⚠️";
    const title = `${icon} ${alert.title} — ${alert.source}`;
    
    const body = `${alert.description}\n\nAffected Region: ${alert.affectedRegions.join(", ")}\nValid Until: ${alert.expiresAt || "Further Notice"}`;

    try {
        const n = new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: alert.id,
            requireInteraction: alert.severity === "CRITICAL" || alert.severity === "SEVERE",
        });

        n.onclick = () => {
            window.focus();
            if (alert.sourceUrl) {
                window.open(alert.sourceUrl, "_blank");
            }
        };
    } catch (err) {
        console.warn("Failed to trigger browser notification:", err);
    }
}
