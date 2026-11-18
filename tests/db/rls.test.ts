import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PG, asUser, attempt, connect, createUser, deleteUsers, type Db } from "./helpers";

/**
 * Isolamento entre usuários: A cria dados; B tenta ler, alterar, excluir
 * e referenciar esses dados por todos os caminhos.
 */
let db: Db;
let userA: string;
let userB: string;
const a: Record<string, string> = {};

beforeAll(async () => {
  db = await connect();
  userA = await createUser(db);
  userB = await createUser(db);

  await asUser(
    db,
    userA,
    async (q) => {
      a.food = (
        await q.query(
          `insert into public.foods (name, base_unit, base_quantity, calories) values ('Ovo', 'unidade', 1, 70) returning id`,
        )
      ).rows[0].id;
      a.recipe = (
        await q.query(
          `select public.save_recipe(null, 'Ovo mexido', 1, null, $1::jsonb) as id`,
          [JSON.stringify([{ food_id: a.food, quantity: 2, unit: "unidade" }])],
        )
      ).rows[0].id;
      a.meal = (
        await q.query(
          `select public.save_meal(null, '2026-11-18', 'almoco', null, $1::jsonb) as id`,
          [
            JSON.stringify([
              { id: null, food_id: a.food, recipe_id: null, quantity: 1, unit: "unidade",
                snapshot: { name: "Ovo", calories: 70, incomplete_nutrients: ["carbs_g"] } },
            ]),
          ],
        )
      ).rows[0].id;
      a.exercise = (
        await q.query(
          `insert into public.exercises (name, muscle_group) values ('Leg press', 'quadriceps') returning id`,
        )
      ).rows[0].id;
      a.workout = (
        await q.query(
          `select public.save_workout(null, '2026-11-18', 'Pernas', null, $1::jsonb) as id`,
          [JSON.stringify([{ exercise_id: a.exercise, sets: [{ load_kg: 120, reps: 10 }] }])],
        )
      ).rows[0].id;
      a.workoutExercise = (
        await q.query(`select id from public.workout_exercises where workout_id = $1`, [a.workout])
      ).rows[0].id;
      a.checkin = (
        await q.query(
          `insert into public.daily_checkins (date, weight_kg) values ('2026-11-18', 80.5) returning id`,
        )
      ).rows[0].id;
    },
    { commit: true },
  );
});

afterAll(async () => {
  await deleteUsers(db, [userA, userB]);
  await db.end();
});

const TABLES = [
  "foods",
  "recipes",
  "recipe_items",
  "daily_meals",
  "daily_meal_items",
  "exercises",
  "workouts",
  "workout_exercises",
  "exercise_sets",
  "daily_checkins",
] as const;

describe("leitura", () => {
  it.each(TABLES)("B não vê nenhum registro de A em %s", async (table) => {
    const count = await asUser(db, userB, async (q) =>
      Number((await q.query(`select count(*) from public.${table}`)).rows[0].count),
    );
    expect(count).toBe(0);
  });

  it.each(TABLES)("A vê os próprios registros em %s", async (table) => {
    const count = await asUser(db, userA, async (q) =>
      Number((await q.query(`select count(*) from public.${table}`)).rows[0].count),
    );
    expect(count).toBeGreaterThan(0);
  });

  it("B só enxerga o próprio perfil", async () => {
    const rows = await asUser(db, userB, async (q) => (await q.query(`select id from public.profiles`)).rows);
    expect(rows).toEqual([{ id: userB }]);
  });
});

describe("anon (sem login)", () => {
  it.each([...TABLES, "profiles"])("não tem acesso a %s", async (table) => {
    const code = await asUser(db, null, async (q) => attempt(q, `select * from public.${table}`));
    expect(code).toBe(PG.RLS_VIOLATION);
  });

  it("não pode executar as funções de gravação", async () => {
    const code = await asUser(db, null, async (q) =>
      attempt(q, `select public.save_meal(null, '2026-11-18', 'almoco', null, '[]'::jsonb)`),
    );
    expect(code).toBe(PG.RLS_VIOLATION);
  });
});

describe("alteração e exclusão", () => {
  it.each([
    ["foods", "name = 'hack'", "food"],
    ["recipes", "name = 'hack'", "recipe"],
    ["daily_meals", "custom_name = null", "meal"],
    ["exercises", "name = 'hack'", "exercise"],
    ["workouts", "title = 'hack'", "workout"],
    ["daily_checkins", "weight_kg = 1", "checkin"],
  ] as const)("B não altera nem exclui %s de A", async (table, set, key) => {
    const [updated, deleted] = await asUser(db, userB, async (q) => [
      (await q.query(`update public.${table} set ${set} where id = $1`, [a[key]])).rowCount,
      (await q.query(`delete from public.${table} where id = $1`, [a[key]])).rowCount,
    ]);
    expect(updated).toBe(0);
    expect(deleted).toBe(0);
  });

  it("B não altera o perfil de A", async () => {
    const updated = await asUser(db, userB, async (q) =>
      (await q.query(`update public.profiles set display_name = 'hack' where id = $1`, [userA])).rowCount,
    );
    expect(updated).toBe(0);
  });

  it("A não consegue transferir um registro para B (user_id)", async () => {
    const code = await asUser(db, userA, async (q) =>
      attempt(q, `update public.foods set user_id = $1 where id = $2`, [userB, a.food]),
    );
    expect(code).toBe(PG.RLS_VIOLATION);
  });
});

describe("inserção em nome de outro usuário", () => {
  it("B não insere alimento com user_id de A", async () => {
    const code = await asUser(db, userB, async (q) =>
      attempt(
        q,
        `insert into public.foods (user_id, name, base_unit, base_quantity, calories) values ($1, 'x', 'g', 100, 1)`,
        [userA],
      ),
    );
    expect(code).toBe(PG.RLS_VIOLATION);
  });
});

describe("referências cruzadas (chaves compostas)", () => {
  it("receita de B não pode usar alimento de A", async () => {
    const code = await asUser(db, userB, async (q) => {
      const recipe = (
        await q.query(`insert into public.recipes (name) values ('Minha') returning id`)
      ).rows[0].id;
      return attempt(
        q,
        `insert into public.recipe_items (recipe_id, food_id, quantity, unit) values ($1, $2, 1, 'unidade')`,
        [recipe, a.food],
      );
    });
    expect(code).toBe(PG.FK_VIOLATION);
  });

  it("B não adiciona ingrediente na receita de A", async () => {
    const code = await asUser(db, userB, async (q) => {
      const food = (
        await q.query(
          `insert into public.foods (name, base_unit, base_quantity, calories) values ('Pão', 'g', 50, 140) returning id`,
        )
      ).rows[0].id;
      return attempt(
        q,
        `insert into public.recipe_items (recipe_id, food_id, quantity, unit) values ($1, $2, 1, 'g')`,
        [a.recipe, food],
      );
    });
    expect(code).toBe(PG.FK_VIOLATION);
  });

  it("refeição de B não pode usar alimento nem receita de A", async () => {
    const codes = await asUser(db, userB, async (q) => {
      const meal = (
        await q.query(
          `insert into public.daily_meals (date, meal_type) values ('2026-11-18', 'jantar') returning id`,
        )
      ).rows[0].id;
      return [
        await attempt(
          q,
          `insert into public.daily_meal_items (meal_id, food_id, quantity, unit, name_snapshot, calories)
           values ($1, $2, 1, 'unidade', 'x', 1)`,
          [meal, a.food],
        ),
        await attempt(
          q,
          `insert into public.daily_meal_items (meal_id, recipe_id, quantity, unit, name_snapshot, calories)
           values ($1, $2, 1, 'porcao', 'x', 1)`,
          [meal, a.recipe],
        ),
      ];
    });
    expect(codes).toEqual([PG.FK_VIOLATION, PG.FK_VIOLATION]);
  });

  it("B não adiciona item na refeição de A", async () => {
    const code = await asUser(db, userB, async (q) => {
      const food = (
        await q.query(
          `insert into public.foods (name, base_unit, base_quantity, calories) values ('Pão', 'g', 50, 140) returning id`,
        )
      ).rows[0].id;
      return attempt(
        q,
        `insert into public.daily_meal_items (meal_id, food_id, quantity, unit, name_snapshot, calories)
         values ($1, $2, 50, 'g', 'Pão', 140)`,
        [a.meal, food],
      );
    });
    expect(code).toBe(PG.FK_VIOLATION);
  });

  it("série não pode ser inserida em exercício de treino de A", async () => {
    const code = await asUser(db, userB, async (q) =>
      attempt(
        q,
        `insert into public.exercise_sets (workout_exercise_id, set_number, load_kg, reps) values ($1, 9, 10, 10)`,
        [a.workoutExercise],
      ),
    );
    expect(code).toBe(PG.FK_VIOLATION);
  });

  it("treino de B não pode usar exercício de A", async () => {
    const code = await asUser(db, userB, async (q) =>
      attempt(
        q,
        `select public.save_workout(null, '2026-11-18', 'X', null, $1::jsonb)`,
        [JSON.stringify([{ exercise_id: a.exercise, sets: [{ load_kg: 10, reps: 10 }] }])],
      ),
    );
    expect(code).toBe(PG.FK_VIOLATION);
  });

  it("B não consegue editar a refeição, receita ou treino de A pelas funções", async () => {
    const codes = await asUser(db, userB, async (q) => [
      await attempt(q, `select public.save_meal($1, '2026-11-18', 'almoco', null, $2::jsonb)`, [
        a.meal,
        JSON.stringify([{ id: null, food_id: a.food, quantity: 1, unit: "unidade", snapshot: { name: "x", calories: 1 } }]),
      ]),
      await attempt(q, `select public.save_recipe($1, 'x', 1, null, $2::jsonb)`, [
        a.recipe,
        JSON.stringify([{ food_id: a.food, quantity: 1, unit: "unidade" }]),
      ]),
      await attempt(q, `select public.save_workout($1, '2026-11-18', 'x', null, $2::jsonb)`, [
        a.workout,
        JSON.stringify([{ exercise_id: a.exercise, sets: [{ reps: 1 }] }]),
      ]),
    ]);
    expect(codes).toEqual([PG.NO_DATA_FOUND, PG.NO_DATA_FOUND, PG.NO_DATA_FOUND]);
  });
});
