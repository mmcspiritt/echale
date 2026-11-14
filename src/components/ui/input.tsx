"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-white px-3.5 text-small text-ink transition-colors placeholder:text-ink-2/70 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
