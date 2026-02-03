import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-300",
          "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-zinc-900",
          "hover:border-zinc-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
