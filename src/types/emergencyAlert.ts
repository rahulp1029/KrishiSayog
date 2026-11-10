export type AlertSeverity = "INFO" | "WATCH" | "WARNING" | "SEVERE" | "CRITICAL";

export type AlertEventType = 
    | "HEAVY_RAIN" 
    | "FLOOD" 
    | "FLASH_FLOOD" 
    | "CYCLONE" 
    | "THUNDERSTORM" 
    | "STRONG_WIND" 
    | "HEATWAVE" 
    | "PEST_OUTBREAK"
    | "OTHER";

export interface EmergencyAlert {
    id: string;
    source: string;
    sourceUrl?: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    eventType: AlertEventType;
    affectedRegions: string[];
    issuedAt: string;
    effectiveFrom?: string;
    expiresAt?: string;
    instructions?: string[];
    isGovernmentVerified: boolean;
    isLocalSensorRisk?: boolean;
}
