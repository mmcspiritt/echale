import { StoryCategory } from "@/lib/types";

export const categories: Array<{
  key: StoryCategory;
  label: string;
  emoji: string;
}> = [
  { key: "sismo", label: "Sismo", emoji: "💗" },
  { key: "salud", label: "Salud", emoji: "💚" },
  { key: "regresar-a-casa", label: "Regresar a casa", emoji: "🚌" },
  { key: "vivienda", label: "Vivienda", emoji: "🏠" },
  { key: "educacion", label: "Educación", emoji: "📘" },
];

export const categoryLabelMap = new Map(categories.map((item) => [item.key, item.label]));
