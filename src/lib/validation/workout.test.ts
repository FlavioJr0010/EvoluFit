import { describe, expect, it } from "vitest";

import { exerciseSchema, workoutSchema } from "./workout";

const ex = "4b1e7a2a-5d0b-4f7e-9f5e-2b8a1c3d4e5f";
const base = {
  id: null,
  date: "2026-11-18",
  title: "Treino de pernas",
  notes: "",
  exercises: [{ exercise_id: ex, notes: "", sets: [{ load_kg: "120", reps: "10", is_warmup: false, notes: "" }] }],
};

describe("workoutSchema", () => {
  it("converte carga com vírgula e repetições", () => {
    const w = workoutSchema.parse({
      ...base,
      exercises: [{ ...base.exercises[0], sets: [{ load_kg: "22,5", reps: "8", is_warmup: true, notes: "falha" }] }],
    });
    expect(w.exercises[0].sets[0]).toEqual({ load_kg: 22.5, reps: 8, is_warmup: true, notes: "falha" });
  });

  it("carga vazia = exercício sem carga", () => {
    const w = workoutSchema.parse({ ...base, exercises: [{ ...base.exercises[0], sets: [{ load_kg: "", reps: "12", is_warmup: false, notes: "" }] }] });
    expect(w.exercises[0].sets[0].load_kg).toBeNull();
  });

  it("rejeita treino sem exercício, exercício sem série, repetições inválidas e carga negativa", () => {
    expect(workoutSchema.safeParse({ ...base, exercises: [] }).success).toBe(false);
    expect(workoutSchema.safeParse({ ...base, exercises: [{ ...base.exercises[0], sets: [] }] }).success).toBe(false);
    for (const set of [{ reps: "0" }, { reps: "8,5" }, { reps: "" }, { load_kg: "-10" }]) {
      expect(workoutSchema.safeParse({ ...base, exercises: [{ ...base.exercises[0], sets: [{ ...base.exercises[0].sets[0], ...set }] }] }).success).toBe(false);
    }
  });

  it("exige título", () => {
    expect(workoutSchema.safeParse({ ...base, title: " " }).success).toBe(false);
  });
});

describe("exerciseSchema", () => {
  it("grupo muscular da lista fixa", () => {
    expect(exerciseSchema.safeParse({ name: "Leg press", muscle_group: "quadriceps", equipment: "", notes: "" }).success).toBe(true);
    expect(exerciseSchema.safeParse({ name: "Leg press", muscle_group: "pernas", equipment: "", notes: "" }).success).toBe(false);
  });
});
