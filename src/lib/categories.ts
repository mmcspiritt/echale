import { StoryCategory } from "@/lib/types";

export const categories: Array<{
  key: StoryCategory;
  label: string;
}> = [
  { key: "sismo", label: "Sismo" },
  { key: "salud", label: "Salud" },
  { key: "regresar-a-casa", label: "Regresar a casa" },
  { key: "vivienda", label: "Vivienda" },
  { key: "educacion", label: "Educación" },
];

export const categoryLabelMap = new Map(categories.map((item) => [item.key, item.label]));
