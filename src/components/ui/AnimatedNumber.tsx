import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
    value: number | string | null | undefined;
    decimals?: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}

export function AnimatedNumber({
    value,
    decimals = 0,
    duration = 600,
    prefix = "",
    suffix = "",
    className = "",
}: AnimatedNumberProps) {
    const isNonNumeric = value === "-" || value === null || value === undefined || (typeof value === "string" && isNaN(Number(value)));

    const numValue = isNonNumeric ? 0 : typeof value === "number" ? value : parseFloat(value as string);
    const [display, setDisplay] = useState(numValue);
    const prevRef = useRef(numValue);
    const frameRef = useRef<number>();

    useEffect(() => {
        if (isNonNumeric) return;
        const from = prevRef.current;
        const to = numValue;
        const diff = to - from;

        if (Math.abs(diff) < 0.01) {
            setDisplay(to);
            prevRef.current = to;
            return;
        }

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + diff * eased;

            setDisplay(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                prevRef.current = to;
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [numValue, duration, isNonNumeric]);

    if (isNonNumeric) {
        return (
            <span className={`tabular-nums ${className}`}>
                {value ?? "-"}
            </span>
        );
    }

    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
