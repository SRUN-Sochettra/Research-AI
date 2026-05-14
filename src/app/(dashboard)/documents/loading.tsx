import { DocumentListSkeleton } from "@/components/shared/loading-states";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-9 w-28" />
            </div>

            <DocumentListSkeleton />
        </div>
    );
}