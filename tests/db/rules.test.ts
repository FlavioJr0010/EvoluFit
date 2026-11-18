import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PG, asUser, attempt, connect, createUser, deleteUsers, type Db } from "./helpers";

let db: Db;
let user: string;

beforeAll(async () => {
  db = await connect();
  user = await createUser(db);
});

afterAll(async () => {
  await deleteUsers(db, [user]);
  await db.end();
});

const run = <T>(fn: (q: Db) => Promise<T>) => asUser(db, user, fn);

async function insertFood(q: Db, extra = "", values = "") {
  return (
    await q.query(
      `insert into public.foods (name, base_unit, base_quantity, calories${extra})
       values ('Pão francês', 'g', 50, 150${values}) returning id`,
    )
  ).rows[0].id as string;
}

describe("perfil", () => {
  it("é criado automaticamente com fuso America/Bahia", async () => {
    const tz = await run(async (q) => (await q.query(`select timezone from public.profiles`)).rows[0].timezone);
    expect(tz).toBe("America/Bahia");
  });

  it("aceita fuso válido e rejeita inválido", async () => {
    const codes = await run(async (q) => [
      await attempt(q, `update public.profiles set timezone = 'America/Sao_Paulo'`),
      await attempt(q, `update public.profiles set timezone = 'Lua/Base'`),
    ]);
    expect(codes).toEqual([null, PG.CHECK_VIOLATION]);
  });

  it("não permite alterar colunas protegidas", async () => {
    const code = await run((q) => attempt(q, `update public.profiles set created_at = now()`));
    expect(code).toBe(PG.RLS_VIOLATION);
  });
});

describe("alimentos", () => {
  it("rejeita calorias negativas, base zero e saturada maior que total", async () => {
    const codes = await run(async (q) => [
      await attempt(q, `insert into public.foods (name, base_unit, base_quantity, calories) values ('x', 'g', 100, -1)`),
      await attempt(q, `insert into public.foods (name, base_unit, base_quantity, calories) values ('x', 'g', 0, 1)`),
      await attempt(
        q,
        `insert into public.foods (name, base_unit, base_quantity, calories, fat_g, saturated_fat_g) values ('x', 'g', 100, 1, 2, 3)`,
      ),
      await attempt(q, `insert into public.foods (name, base_unit, base_quantity, calories) values ('x', 'porcao', 1, 1)`),
    ]);
    expect(codes).toEqual([PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION]);
  });

  it("peso por unidade exige unidade coerente com a base", async () => {
    const codes = await run(async (q) => [
      await attempt(
        q,
        `insert into public.foods (name, base_unit, base_quantity, calories, unit_weight, unit_weight_unit) values ('x', 'g', 100, 1, 50, 'g')`,
      ),
      await attempt(
        q,
        `insert into public.foods (name, base_unit, base_quantity, calories, unit_weight, unit_weight_unit) values ('x', 'g', 100, 1, 50, 'ml')`,
      ),
      await attempt(q, `insert into public.foods (name, base_unit, base_quantity, calories, unit_weight) values ('x', 'g', 100, 1, 50)`),
      await attempt(
        q,
        `insert into public.foods (name, base_unit, base_quantity, calories, unit_weight, unit_weight_unit) values ('x', 'unidade', 1, 1, 50, 'ml')`,
      ),
    ]);
    expect(codes).toEqual([null, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, null]);
  });

  it("alimento em uso não pode ser excluído; alimento sem uso pode", async () => {
    const [usedCode, unusedCode] = await run(async (q) => {
      const used = await insertFood(q);
      const unused = await insertFood(q);
      await q.query(`select public.save_recipe(null, 'Torrada', 1, null, $1::jsonb)`, [
        JSON.stringify([{ food_id: used, quantity: 50, unit: "g" }]),
      ]);
      return [
        await attempt(q, `delete from public.foods where id = $1`, [used]),
        await attempt(q, `delete from public.foods where id = $1`, [unused]),
      ];
    });
    expect(usedCode).toBe(PG.FK_VIOLATION);
    expect(unusedCode).toBeNull();
  });

  it("valida a unidade do ingrediente conforme o alimento", async () => {
    const codes = await run(async (q) => {
      const plain = await insertFood(q);
      const withUnit = await insertFood(q, ", unit_weight, unit_weight_unit", ", 50, 'g'");
      const items = (food: string, unit: string) =>
        JSON.stringify([{ food_id: food, quantity: 1, unit }]);
      return [
        await attempt(q, `select public.save_recipe(null, 'r', 1, null, $1::jsonb)`, [items(plain, "unidade")]),
        await attempt(q, `select public.save_recipe(null, 'r', 1, null, $1::jsonb)`, [items(plain, "ml")]),
        await attempt(q, `select public.save_recipe(null, 'r', 1, null, $1::jsonb)`, [items(withUnit, "unidade")]),
      ];
    });
    expect(codes).toEqual([PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, null]);
  });
});

describe("receitas", () => {
  it("exigem pelo menos um ingrediente e rendimento positivo", async () => {
    const codes = await run(async (q) => {
      const food = await insertFood(q);
      return [
        await attempt(q, `select public.save_recipe(null, 'r', 1, null, '[]'::jsonb)`),
        await attempt(q, `select public.save_recipe(null, 'r', 0, null, $1::jsonb)`, [
          JSON.stringify([{ food_id: food, quantity: 1, unit: "g" }]),
        ]),
      ];
    });
    expect(codes).toEqual([PG.INVALID_PARAMETER, PG.CHECK_VIOLATION]);
  });

  it("editar substitui os ingredientes", async () => {
    const count = await run(async (q) => {
      const food = await insertFood(q);
      const items = (n: number) =>
        JSON.stringify(Array.from({ length: n }, () => ({ food_id: food, quantity: 10, unit: "g" })));
      const id = (await q.query(`select public.save_recipe(null, 'r', 2, null, $1::jsonb) as id`, [items(3)])).rows[0].id;
      await q.query(`select public.save_recipe($1, 'r', 2, null, $2::jsonb)`, [id, items(1)]);
      return Number((await q.query(`select count(*) from public.recipe_items where recipe_id = $1`, [id])).rows[0].count);
    });
    expect(count).toBe(1);
  });
});

describe("refeições", () => {
  const snapshot = (name: string, calories: number) => ({
    name,
    calories,
    carbs_g: null,
    protein_g: 5,
    fiber_g: null,
    fat_g: null,
    saturated_fat_g: null,
    sodium_mg: null,
    incomplete_nutrients: ["carbs_g", "fiber_g", "fat_g", "saturated_fat_g", "sodium_mg"],
  });

  it("refeição personalizada exige nome; as demais não aceitam nome", async () => {
    const codes = await run(async (q) => [
      await attempt(q, `insert into public.daily_meals (date, meal_type) values ('2026-11-18', 'personalizada')`),
      await attempt(q, `insert into public.daily_meals (date, meal_type, custom_name) values ('2026-11-18', 'almoco', 'x')`),
      await attempt(q, `insert into public.daily_meals (date, meal_type, custom_name) values ('2026-11-18', 'personalizada', 'Pré-treino')`),
    ]);
    expect(codes).toEqual([PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, null]);
  });

  it("permite mais de uma refeição do mesmo tipo no dia", async () => {
    const code = await run(async (q) => {
      await q.query(`insert into public.daily_meals (date, meal_type) values ('2026-11-18', 'lanche')`);
      return attempt(q, `insert into public.daily_meals (date, meal_type) values ('2026-11-18', 'lanche')`);
    });
    expect(code).toBeNull();
  });

  it("item precisa de exatamente uma origem e unidade coerente", async () => {
    const codes = await run(async (q) => {
      const food = await insertFood(q);
      const meal = (await q.query(`insert into public.daily_meals (date, meal_type) values ('2026-11-18', 'jantar') returning id`)).rows[0].id;
      return [
        await attempt(
          q,
          `insert into public.daily_meal_items (meal_id, quantity, unit, name_snapshot, calories) values ($1, 1, 'g', 'x', 1)`,
          [meal],
        ),
        await attempt(
          q,
          `insert into public.daily_meal_items (meal_id, food_id, quantity, unit, name_snapshot, calories) values ($1, $2, 1, 'porcao', 'x', 1)`,
          [meal, food],
        ),
        await attempt(
          q,
          `insert into public.daily_meal_items (meal_id, food_id, quantity, unit, name_snapshot, calories, incomplete_nutrients)
           values ($1, $2, 1, 'g', 'x', 1, '{vitamina_c}')`,
          [meal, food],
        ),
      ];
    });
    expect(codes).toEqual([PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION]);
  });

  it("save_meal mantém snapshot de itens inalterados, atualiza os alterados e remove os excluídos", async () => {
    const result = await run(async (q) => {
      const food = await insertFood(q);
      const mealId = (
        await q.query(`select public.save_meal(null, '2026-11-18', 'almoco', null, $1::jsonb) as id`, [
          JSON.stringify([
            { id: null, food_id: food, quantity: 50, unit: "g", snapshot: snapshot("Pão", 150) },
            { id: null, food_id: food, quantity: 100, unit: "g", snapshot: snapshot("Pão", 300) },
            { id: null, food_id: food, quantity: 25, unit: "g", snapshot: snapshot("Pão", 75) },
          ]),
        ])
      ).rows[0].id;
      const items = (
        await q.query(`select id from public.daily_meal_items where meal_id = $1 order by position`, [mealId])
      ).rows.map((r) => r.id as string);

      // o cadastro do alimento é corrigido depois
      await q.query(`update public.foods set calories = 999 where id = $1`, [food]);

      await q.query(`select public.save_meal($1, '2026-11-18', 'almoco', null, $2::jsonb)`, [
        mealId,
        JSON.stringify([
          { id: items[1], food_id: food, quantity: 100, unit: "g", snapshot: null }, // inalterado, nova posição
          { id: items[0], food_id: food, quantity: 75, unit: "g", snapshot: snapshot("Pão", 225) }, // alterado
          { id: null, food_id: food, quantity: 10, unit: "g", snapshot: snapshot("Pão", 30) }, // novo
        ]),
      ]);

      return (
        await q.query(
          `select id, quantity::float, calories::float, position, incomplete_nutrients
             from public.daily_meal_items where meal_id = $1 order by position`,
          [mealId],
        )
      ).rows.map((r) => ({ ...r, id: items.indexOf(r.id) }));
    });

    expect(result).toEqual([
      { id: 1, quantity: 100, calories: 300, position: 0, incomplete_nutrients: expect.any(Array) },
      { id: 0, quantity: 75, calories: 225, position: 1, incomplete_nutrients: expect.any(Array) },
      { id: -1, quantity: 10, calories: 30, position: 2, incomplete_nutrients: expect.any(Array) },
    ]);
  });

  it("save_meal é atômica: um item inválido desfaz a refeição inteira", async () => {
    const count = await run(async (q) => {
      const food = await insertFood(q);
      await attempt(q, `select public.save_meal(null, '2026-12-01', 'jantar', null, $1::jsonb)`, [
        JSON.stringify([
          { id: null, food_id: food, quantity: 50, unit: "g", snapshot: snapshot("Pão", 150) },
          { id: null, food_id: food, quantity: -1, unit: "g", snapshot: snapshot("Pão", 1) },
        ]),
      ]);
      return Number((await q.query(`select count(*) from public.daily_meals where date = '2026-12-01'`)).rows[0].count);
    });
    expect(count).toBe(0);
  });

  it("save_meal rejeita item novo sem snapshot e refeição vazia", async () => {
    const codes = await run(async (q) => {
      const food = await insertFood(q);
      return [
        await attempt(q, `select public.save_meal(null, '2026-11-18', 'almoco', null, $1::jsonb)`, [
          JSON.stringify([{ id: null, food_id: food, quantity: 1, unit: "g", snapshot: null }]),
        ]),
        await attempt(q, `select public.save_meal(null, '2026-11-18', 'almoco', null, '[]'::jsonb)`),
      ];
    });
    expect(codes).toEqual([PG.INVALID_PARAMETER, PG.INVALID_PARAMETER]);
  });

  it("excluir a refeição remove os itens", async () => {
    const count = await run(async (q) => {
      const food = await insertFood(q);
      const id = (
        await q.query(`select public.save_meal(null, '2026-11-18', 'almoco', null, $1::jsonb) as id`, [
          JSON.stringify([{ id: null, food_id: food, quantity: 50, unit: "g", snapshot: snapshot("Pão", 150) }]),
        ])
      ).rows[0].id;
      await q.query(`delete from public.daily_meals where id = $1`, [id]);
      return Number((await q.query(`select count(*) from public.daily_meal_items where meal_id = $1`, [id])).rows[0].count);
    });
    expect(count).toBe(0);
  });
});

describe("treinos", () => {
  it("salva exercícios e séries com cargas e repetições distintas, inclusive sem carga", async () => {
    const sets = await run(async (q) => {
      const ex = (await q.query(`insert into public.exercises (name, muscle_group) values ('Leg press', 'quadriceps') returning id`)).rows[0].id;
      const bar = (await q.query(`insert into public.exercises (name, muscle_group) values ('Barra fixa', 'costas') returning id`)).rows[0].id;
      const id = (
        await q.query(`select public.save_workout(null, '2026-11-18', 'Treino de pernas', null, $1::jsonb) as id`, [
          JSON.stringify([
            {
              exercise_id: ex,
              sets: [
                { load_kg: 60, reps: 15, is_warmup: true },
                { load_kg: 120, reps: 10 },
                { load_kg: 130, reps: 8 },
                { load_kg: 130, reps: 8, notes: "falha" },
              ],
            },
            { exercise_id: bar, sets: [{ load_kg: null, reps: 12 }] },
          ]),
        ])
      ).rows[0].id;
      return (
        await q.query(
          `select we.position, s.set_number, s.load_kg::float, s.reps, s.is_warmup
             from public.exercise_sets s join public.workout_exercises we on we.id = s.workout_exercise_id
            where we.workout_id = $1 order by we.position, s.set_number`,
          [id],
        )
      ).rows;
    });
    expect(sets).toEqual([
      { position: 0, set_number: 1, load_kg: 60, reps: 15, is_warmup: true },
      { position: 0, set_number: 2, load_kg: 120, reps: 10, is_warmup: false },
      { position: 0, set_number: 3, load_kg: 130, reps: 8, is_warmup: false },
      { position: 0, set_number: 4, load_kg: 130, reps: 8, is_warmup: false },
      { position: 1, set_number: 1, load_kg: null, reps: 12, is_warmup: false },
    ]);
  });

  it("exige exercício com séries e repetições positivas", async () => {
    const codes = await run(async (q) => {
      const ex = (await q.query(`insert into public.exercises (name, muscle_group) values ('Supino', 'peito') returning id`)).rows[0].id;
      const save = (payload: unknown) =>
        attempt(q, `select public.save_workout(null, '2026-11-18', 'Peito', null, $1::jsonb)`, [JSON.stringify(payload)]);
      return [
        await save([]),
        await save([{ exercise_id: ex, sets: [] }]),
        await save([{ exercise_id: ex, sets: [{ load_kg: 50, reps: 0 }] }]),
        await save([{ exercise_id: ex, sets: [{ load_kg: -5, reps: 10 }] }]),
      ];
    });
    expect(codes).toEqual([PG.INVALID_PARAMETER, PG.INVALID_PARAMETER, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION]);
  });

  it("exercício usado em treino não pode ser excluído", async () => {
    const code = await run(async (q) => {
      const ex = (await q.query(`insert into public.exercises (name, muscle_group) values ('Remada', 'costas') returning id`)).rows[0].id;
      await q.query(`select public.save_workout(null, '2026-11-18', 'Costas', null, $1::jsonb)`, [
        JSON.stringify([{ exercise_id: ex, sets: [{ load_kg: 40, reps: 10 }] }]),
      ]);
      return attempt(q, `delete from public.exercises where id = $1`, [ex]);
    });
    expect(code).toBe(PG.FK_VIOLATION);
  });
});

describe("acompanhamento diário", () => {
  it("um registro por data; upsert atualiza em vez de duplicar", async () => {
    const rows = await run(async (q) => {
      await q.query(`insert into public.daily_checkins (date, weight_kg) values ('2026-11-10', 80)`);
      const dup = await attempt(q, `insert into public.daily_checkins (date, water_ml) values ('2026-11-10', 500)`);
      await q.query(
        `insert into public.daily_checkins (user_id, date, water_ml) values (auth.uid(), '2026-11-10', 750)
         on conflict (user_id, date) do update set water_ml = excluded.water_ml`,
      );
      const data = (
        await q.query(`select weight_kg::float, water_ml from public.daily_checkins where date = '2026-11-10'`)
      ).rows;
      return { dup, data };
    });
    expect(rows.dup).toBe(PG.UNIQUE_VIOLATION);
    expect(rows.data).toEqual([{ weight_kg: 80, water_ml: 750 }]);
  });

  it("exige peso ou água e valores plausíveis", async () => {
    const codes = await run(async (q) => [
      await attempt(q, `insert into public.daily_checkins (date, notes) values ('2026-11-11', 'só nota')`),
      await attempt(q, `insert into public.daily_checkins (date, weight_kg) values ('2026-11-12', 0)`),
      await attempt(q, `insert into public.daily_checkins (date, water_ml) values ('2026-11-13', -100)`),
      await attempt(q, `insert into public.daily_checkins (date, water_ml) values ('2026-11-14', 0)`),
    ]);
    expect(codes).toEqual([PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, PG.CHECK_VIOLATION, null]);
  });
});
