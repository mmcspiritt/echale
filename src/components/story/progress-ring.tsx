"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 180,
  stroke = 13,
  caption = "de tu meta",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  caption?: string;
  className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalized / 100) * circumference;
  const compact = size < 130;
  const percentageFontSize = compact ? "text-2xl" : "text-5xl";

  return (
    <div className={cn("relative inline-grid place-items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-transparent stroke-zinc-100"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-transparent stroke-[#E4007C]"
          style={{ strokeDasharray: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6 }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center leading-none">
        <p className={cn("font-black text-[#E4007C]", percentageFontSize)}>{normalized}%</p>
        {!compact ? <p className="mt-1 text-sm text-zinc-500">{caption}</p> : null}
      </div>
    </div>
  );
}
