import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("synapse-mark", className)}>
      <span className="synapse-mark__line synapse-mark__line--a" />
      <span className="synapse-mark__line synapse-mark__line--b" />
      <span className="synapse-mark__line synapse-mark__line--c" />
      <span className="synapse-mark__node synapse-mark__node--a" />
      <span className="synapse-mark__node synapse-mark__node--b" />
      <span className="synapse-mark__node synapse-mark__node--c" />
      <span className="synapse-mark__node synapse-mark__node--d" />
    </span>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-none font-semibold tracking-[-0.03em]">
        Synapse<span className="text-primary">Doc</span>
        {!compact && (
          <span className="text-muted-foreground ml-2 hidden text-[0.66rem] font-medium tracking-[0.16em] uppercase sm:inline">
            Research workspace
          </span>
        )}
      </span>
    </span>
  );
}
