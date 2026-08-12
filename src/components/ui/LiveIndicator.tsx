import { useEffect, useState } from "react";

interface LiveIndicatorProps {
    isLive: boolean;
    lastUpdated: number | null;
    label?: string;
    mode?: string;
}

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
}

export function LiveIndicator({ isLive, lastUpdated, label = "Live", mode }: LiveIndicatorProps) {
    const [ago, setAgo] = useState("");

    useEffect(() => {
        const update = () => {
            if (lastUpdated) setAgo(timeAgo(lastUpdated));
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [lastUpdated]);

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
                <span className={`relative flex h-2.5 w-2.5`}>
                    {isLive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? "bg-green-500" : "bg-red-400"}`} />
                </span>
                <span className={`font-semibold ${isLive ? "text-green-600" : "text-red-500"}`}>
                    {isLive ? label : "Offline"}
                </span>
            </div>
            {ago && (
                <span className="text-muted-foreground">
                    Updated {ago}
                </span>
            )}
            {mode && (
                <span className="text-muted-foreground/60 ml-1">
                    ({mode === "real" ? "IoT" : "Simulator"})
                </span>
            )}
        </div>
    );
}
