"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  /** Direct hex color for indicator (recommended - same as Recharts approach) */
  indicatorColor?: string;
  /** @deprecated Use indicatorColor instead. Tailwind class for indicator */
  indicatorClassName?: string;
  /** Enable glassmorphism style */
  glass?: boolean;
}

function Progress({
  className,
  value,
  indicatorColor,
  indicatorClassName,
  glass = false,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        glass
          ? "bg-white/30 backdrop-blur-sm border border-white/20 shadow-sm"
          : "bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          // Only use bg-primary if no color override is provided
          !indicatorColor && (indicatorClassName || "bg-primary")
        )}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...(indicatorColor && {
            background: glass
              ? `linear-gradient(90deg, ${indicatorColor}99 0%, ${indicatorColor} 100%)`
              : indicatorColor,
            boxShadow: glass ? `0 0 12px ${indicatorColor}66` : undefined,
          })
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
