import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
            {/* Animated 404 */}
            <div className="relative">
                <p className="select-none text-[120px] font-black leading-none text-muted/30 md:text-[180px]">
                    404
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
                        <Brain className="h-8 w-8 text-primary-foreground" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold md:text-3xl">
                    Page not found
                </h1>
                <p className="max-w-md text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or
                    has been moved.
                </p>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Home
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/documents">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        My Documents
                    </Link>
                </Button>
            </div>
        </div>
    );
}