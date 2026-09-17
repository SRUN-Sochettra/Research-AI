"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const isIndeterminate = value == null;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted relative flex h-1 w-full items-center overflow-x-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full transition-transform",
          isIndeterminate ? "progress-indeterminate w-2/5" : "w-full"
        )}
        style={
          isIndeterminate
            ? undefined
            : {
                transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)`,
              }
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
