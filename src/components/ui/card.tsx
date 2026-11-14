import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-100 bg-white shadow-[0_10px_25px_rgba(18,18,23,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
