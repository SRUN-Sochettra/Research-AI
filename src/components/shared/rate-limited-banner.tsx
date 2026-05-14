"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface RateLimitBannerProps {
    resetTimestamp: number; // Unix ms
    onExpired: () => void;
}

export function RateLimitBanner({
    resetTimestamp,
    onExpired,
}: RateLimitBannerProps) {
    const [secondsLeft, setSecondsLeft] = useState(() =>
        Math.ceil((resetTimestamp - Date.now()) / 1000)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.ceil(
                (resetTimestamp - Date.now()) / 1000
            );

            if (remaining <= 0) {
                clearInterval(interval);
                onExpired();
                return;
            }

            setSecondsLeft(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [resetTimestamp, onExpired]);

    const totalSeconds = 60;
    const progress =
        ((totalSeconds - secondsLeft) / totalSeconds) * 100;

    return (
        <Alert className="border-amber-500/50 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="space-y-2">
                <p className="text-amber-700 dark:text-amber-400">
                    Rate limit reached. Resets in{" "}
                    <span className="font-bold">{secondsLeft}s</span>
                </p>
                <Progress
                    value={progress}
                    className="h-1.5 bg-amber-200 dark:bg-amber-900"
                />
            </AlertDescription>
        </Alert>
    );
}