"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 180,
  stroke = 13,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalized / 100) * circumference;

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
      <div className="absolute text-center">
        <p className="text-5xl font-black text-[#E4007C]">{normalized}%</p>
        <p className="text-sm text-zinc-500">de tu meta</p>
      </div>
    </div>
  );
}
