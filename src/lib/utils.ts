import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const hasCents = Math.abs(rounded % 1) > 0.000001;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(rounded);
}

export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function percentFromAmounts(raised: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

export function toSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function amountToDisplay(amount: number) {
  return amount.toLocaleString("es-MX");
}

export function peopleHelpedLabel(count: number) {
  return count === 1 ? "1 persona ha ayudado" : `${count} personas han ayudado`;
}

export function maskClabe(clabe: string) {
  const clean = clabe.replace(/\D/g, "");
  if (clean.length !== 18) return clabe;
  return `${clean.slice(0, 4)}••••••••••${clean.slice(-4)}`;
}
