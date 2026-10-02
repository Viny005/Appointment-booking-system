import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

export default defineConfig({ ...base, test: {
  // Keep database test processes bounded; concurrency scenarios remain explicit within tests.
  maxWorkers: 2,
  include: ["tests/integration/**/*.test.ts"], testTimeout: 30000, hookTimeout: 30000,
} });
