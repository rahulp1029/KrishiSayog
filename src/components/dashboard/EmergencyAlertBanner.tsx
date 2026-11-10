import { useState } from "react";
import { AlertTriangle, ShieldAlert, Bell, ExternalLink, ChevronDown, ChevronUp, X, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyAlert } from "@/types/emergencyAlert";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";

interface EmergencyAlertBannerProps {
    locationName?: string;
}

export function EmergencyAlertBanner({ locationName = "Nashik, Maharashtra" }: EmergencyAlertBannerProps) {
    const { alerts, permissionState, requestPermission } = useEmergencyAlerts({ locationName });
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

    const activeAlerts = (alerts || []).filter(a => a && a.id && !dismissedIds.includes(a.id));

    if (activeAlerts.length === 0) {
        return null;
    }

    const severityRank: Record<string, number> = {
        CRITICAL: 5,
        SEVERE: 4,
        WARNING: 3,
        WATCH: 2,
        INFO: 1,
    };

    const sortedAlerts = [...activeAlerts].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
    const currentAlert = sortedAlerts[0];

    if (!currentAlert) {
        return null;
    }

    const getSeverityStyles = (severity: string = "INFO", isLocalSensor?: boolean) => {
        if (isLocalSensor) {
            return {
                container: "bg-amber-50/90 border-amber-300 text-amber-950",
                badge: "bg-amber-600 text-white",
                icon: AlertTriangle,
                iconColor: "text-amber-600",
            };
        }

        switch (severity) {
            case "CRITICAL":
                return {
                    container: "bg-red-50 border-2 border-red-600 text-red-950 shadow-md animate-pulse",
                    badge: "bg-red-700 text-white font-black animate-bounce",
                    icon: ShieldAlert,
                    iconColor: "text-red-600",
                };
            case "SEVERE":
                return {
                    container: "bg-orange-50 border-2 border-orange-500 text-orange-950 shadow-sm",
                    badge: "bg-orange-600 text-white font-bold",
                    icon: ShieldAlert,
                    iconColor: "text-orange-600",
                };
            case "WARNING":
                return {
                    container: "bg-amber-50 border-2 border-amber-500 text-amber-950 shadow-sm",
                    badge: "bg-amber-600 text-white font-semibold",
                    icon: AlertTriangle,
                    iconColor: "text-amber-600",
                };
            case "WATCH":
                return {
                    container: "bg-yellow-50 border border-yellow-400 text-yellow-950",
                    badge: "bg-yellow-600 text-white",
                    icon: AlertTriangle,
                    iconColor: "text-yellow-600",
                };
            default:
                return {
                    container: "bg-blue-50 border border-blue-300 text-blue-950",
                    badge: "bg-blue-600 text-white",
                    icon: Info,
                    iconColor: "text-blue-600",
                };
        }
    };

    const styles = getSeverityStyles(currentAlert.severity, currentAlert.isLocalSensorRisk);
    const IconComp = styles.icon;
    const isExpanded = expandedAlertId === currentAlert.id;
    const affectedRegionsList = Array.isArray(currentAlert.affectedRegions) ? currentAlert.affectedRegions.join(", ") : locationName;
    const instructionsList = Array.isArray(currentAlert.instructions) ? currentAlert.instructions : [];

    return (
        <div className={`rounded-xl p-3.5 sm:p-4 mb-4 transition-all duration-300 ${styles.container}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-white/80 shadow-sm shrink-0 mt-0.5">
                        <IconComp className={`h-6 w-6 ${styles.iconColor}`} />
                    </div>

                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${styles.badge}`}>
                                {currentAlert.isGovernmentVerified ? `⚠️ OFFICIAL ${currentAlert.severity || "WEATHER"} WARNING` : currentAlert.severity || "ALERT"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                                Event: {(currentAlert.eventType || "ALERT").replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-500">
                                • {affectedRegionsList}
                            </span>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                            {currentAlert.title || "Emergency Advisory"}
                        </h3>

                        <p className="text-xs leading-relaxed text-slate-800">
                            {currentAlert.description}
                        </p>

                        {/* Attribution & Validity metadata */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1 flex-wrap">
                            <span>
                                <strong>Source:</strong> {currentAlert.source || "Official Agency"}
                            </span>
                            <span>
                                <strong>Issued:</strong> {currentAlert.issuedAt}
                            </span>
                            {currentAlert.expiresAt && (
                                <span>
                                    <strong>Valid Until:</strong> {currentAlert.expiresAt}
                                </span>
                            )}
                        </div>

                        {/* Safety Instructions Dropdown */}
                        {instructionsList.length > 0 && (
                            <div className="pt-2">
                                <button
                                    onClick={() => setExpandedAlertId(isExpanded ? null : currentAlert.id)}
                                    className="text-xs font-bold text-slate-900 underline flex items-center gap-1 hover:text-emerald-700"
                                >
                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    {isExpanded ? "Hide Emergency Farming Precautions" : "View Emergency Farming Precautions"}
                                </button>

                                {isExpanded && (
                                    <div className="mt-2 bg-white/90 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 shadow-sm">
                                        <p className="font-bold text-slate-900 flex items-center gap-1">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                            Recommended Immediate Action:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                                            {instructionsList.map((inst, idx) => (
                                                <li key={idx}>{inst}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    {permissionState === "default" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={requestPermission}
                            className="text-xs gap-1 bg-white hover:bg-slate-100 hidden sm:flex"
                        >
                            <Bell className="h-3.5 w-3.5 text-amber-600" />
                            Enable Notifications
                        </Button>
                    )}

                    {currentAlert.sourceUrl && (
                        <a
                            href={currentAlert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-800"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Official Alert Source
                        </a>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDismissedIds(prev => [...prev, currentAlert.id])}
                        className="h-8 w-8 rounded-full hover:bg-black/10"
                        title="Dismiss Alert"
                    >
                        <X className="h-4 w-4 text-slate-600" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
