import type { Database } from "@/lib/supabase/database.types";

export type MuscleGroup = Database["public"]["Enums"]["muscle_group"];

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "ombros", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "antebracos", label: "Antebraços" },
  { value: "abdomen", label: "Abdômen" },
  { value: "quadriceps", label: "Quadríceps" },
  { value: "posteriores", label: "Posteriores de coxa" },
  { value: "gluteos", label: "Glúteos" },
  { value: "panturrilhas", label: "Panturrilhas" },
  { value: "adutores", label: "Adutores" },
  { value: "abdutores", label: "Abdutores" },
  { value: "corpo_inteiro", label: "Corpo inteiro" },
];

export const muscleGroupLabel = (value: MuscleGroup) => MUSCLE_GROUPS.find((g) => g.value === value)?.label ?? value;
