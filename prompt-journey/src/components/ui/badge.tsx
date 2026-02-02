import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-violet-500/20 text-violet-300 border border-violet-500/30",
        secondary:
          "bg-zinc-800 text-zinc-300 border border-zinc-700",
        success:
          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        warning:
          "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        destructive:
          "bg-red-500/20 text-red-300 border border-red-500/30",
        outline:
          "text-zinc-400 border border-zinc-700",
        gold:
          "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30",
        silver:
          "bg-gradient-to-r from-zinc-400/20 to-slate-400/20 text-zinc-200 border border-zinc-400/30",
        bronze:
          "bg-gradient-to-r from-orange-600/20 to-amber-700/20 text-orange-300 border border-orange-600/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
