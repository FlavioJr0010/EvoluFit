import { defineConfig } from "vitest/config";

// Testes de integração contra o banco local (npm run db:up && npm run db:migrate).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
