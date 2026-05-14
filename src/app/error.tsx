"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log to your error tracking service here
        console.error("Global error boundary:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="max-w-md text-muted-foreground">
                    An unexpected error occurred. Our team has been notified.
                </p>
                {error.digest && (
                    <p className="font-mono text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
                <Button asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go home
                    </Link>
                </Button>
            </div>
        </div>
    );
}