import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h2", "h3", "body", "small", "micro"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  options?: {
    cents?: boolean;
    exact?: boolean;
  },
) {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const hasFraction = Math.abs(rounded % 1) > 0.000001;
  const showCents = typeof options?.cents === "boolean" ? options.cents : hasFraction;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
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
  return count === 1 ? "1 persona apoyó" : `${count} personas apoyaron`;
}

export function supportVerbForDisplayName(displayName: string) {
  const normalized = displayName.toLowerCase();
  return normalized.includes(" y ") || normalized.includes("&") ? "apoyaron" : "apoyó";
}

export function maskClabe(clabe: string) {
  const clean = clabe.replace(/\D/g, "");
  if (clean.length !== 18) return clabe;
  return `${clean.slice(0, 4)}••••••••••${clean.slice(-4)}`;
}

export const WARM_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzQwJyBoZWlnaHQ9JzQwJyBmaWxsPScjRjVFRkU2Jy8+PC9zdmc+";

const STORY_COVER_4X5_PATTERN =
  /^\/stories\/([a-z0-9-]+)\/\1-cover-4x5\.(webp|png|jpe?g)$/i;

export function getStoryWideImagePath(imagePath: string) {
  if (!STORY_COVER_4X5_PATTERN.test(imagePath)) return imagePath;
  return imagePath.replace("-cover-4x5.", "-cover-3x2.");
}

type StoryImageVariant = "card-mobile" | "card-desktop" | "story-mobile" | "story-desktop";

const STORY_FOCAL_POINTS: Record<string, Record<StoryImageVariant, string>> = {
  adrian: {
    "card-mobile": "50% 28%",
    "card-desktop": "46% 36%",
    "story-mobile": "50% 34%",
    "story-desktop": "48% 38%",
  },
  santiago: {
    "card-mobile": "44% 46%",
    "card-desktop": "24% 62%",
    "story-mobile": "46% 52%",
    "story-desktop": "22% 64%",
  },
  miriam: {
    "card-mobile": "48% 42%",
    "card-desktop": "42% 64%",
    "story-mobile": "50% 40%",
    "story-desktop": "40% 68%",
  },
};

export function getStoryImageObjectPosition(slug: string, variant: StoryImageVariant) {
  return STORY_FOCAL_POINTS[slug]?.[variant] ?? "50% 50%";
}
