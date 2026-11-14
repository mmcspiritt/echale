"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-rosa text-white hover:bg-[#A80059] disabled:bg-line disabled:text-ink-2 disabled:opacity-100",
  secondary:
    "bg-jade text-white hover:bg-[#185843]",
  ghost: "bg-transparent text-ink-2 hover:bg-black/5",
  outline:
    "border border-line bg-white text-ink hover:bg-black/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-12 px-5 text-small",
  sm: "h-11 px-3 text-small",
  lg: "h-12 px-6 text-body",
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
          "inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition-colors duration-200 disabled:pointer-events-none focus-visible:outline-none",
          sizeClasses[size],
          variantClasses[variant],
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
