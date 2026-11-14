"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#E4007C] text-white shadow-[0_10px_24px_rgba(228,0,124,0.28)] hover:bg-[#c9006d] focus-visible:ring-[#E4007C]",
  secondary:
    "bg-[#0F7B59] text-white shadow-[0_10px_24px_rgba(15,123,89,0.24)] hover:bg-[#0c6248] focus-visible:ring-[#0F7B59]",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-400",
  outline:
    "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:ring-zinc-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-xs",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
