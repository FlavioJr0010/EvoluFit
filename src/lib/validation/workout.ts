import { z } from "zod";

import { MUSCLE_GROUPS } from "@/lib/training/labels";

import { dateSchema, optionalText, requiredText, uuidSchema } from "./common";
import { optionalDecimalPtBR } from "./decimal";

const muscleValues = MUSCLE_GROUPS.map((g) => g.value) as [string, ...string[]];

export const exerciseSchema = z.object({
  name: requiredText(120, "Informe o nome do exercício."),
  muscle_group: z.enum(muscleValues, { error: "Escolha o grupo muscular." }),
  equipment: optionalText(120),
  notes: optionalText(1000),
});

export const setSchema = z.object({
  load_kg: optionalDecimalPtBR("Carga inválida.").pipe(
    z.number().min(0, "A carga não pode ser negativa.").max(999.99, "Carga muito alta.").nullable(),
  ),
  reps: z.coerce
    .number({ error: "Informe as repetições." })
    .int("Repetições devem ser um número inteiro.")
    .min(1, "Informe ao menos 1 repetição.")
    .max(1000, "Repetições demais."),
  is_warmup: z.boolean().default(false),
  notes: optionalText(500),
});

export const workoutSchema = z.object({
  id: uuidSchema.nullable(),
  date: dateSchema,
  title: requiredText(120, "Informe o título do treino."),
  notes: optionalText(1000),
  exercises: z
    .array(
      z.object({
        exercise_id: uuidSchema,
        notes: optionalText(1000),
        sets: z.array(setSchema).min(1, "Cada exercício precisa de pelo menos uma série.").max(50),
      }),
    )
    .min(1, "Adicione pelo menos um exercício.")
    .max(40),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
