import { z } from "zod";

import { dateSchema, optionalText } from "./common";
import { optionalDecimalPtBR } from "./decimal";

export const WATER_UNITS = ["ml", "L"] as const;

export const checkinSchema = z
  .object({
    date: dateSchema,
    weight_kg: optionalDecimalPtBR().pipe(
      z
        .number()
        .min(20, "Peso deve estar entre 20 e 400 kg.")
        .max(400, "Peso deve estar entre 20 e 400 kg.")
        .nullable(),
    ),
    water: optionalDecimalPtBR().pipe(z.number().min(0, "A água não pode ser negativa.").nullable()),
    water_unit: z.enum(WATER_UNITS),
    notes: optionalText(1000),
  })
  .transform(({ water, water_unit, ...rest }) => ({
    ...rest,
    water_ml: water == null ? null : Math.round(water_unit === "L" ? water * 1000 : water),
  }))
  .superRefine((data, ctx) => {
    if (data.water_ml != null && data.water_ml > 20000) {
      ctx.addIssue({ code: "custom", path: ["water"], message: "Máximo de 20 litros por dia." });
    }
    if (data.weight_kg == null && data.water_ml == null) {
      ctx.addIssue({ code: "custom", path: ["weight_kg"], message: "Informe o peso ou a água do dia." });
    }
  });

export const addWaterSchema = z.object({
  date: dateSchema,
  amount_ml: z.coerce.number().int().min(-5000).max(5000).refine((v) => v !== 0),
});
