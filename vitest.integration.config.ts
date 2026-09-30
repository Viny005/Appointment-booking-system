import { defineConfig } from "vitest/config";
import base from "./vitest.config";

export default defineConfig({ ...base, test: {
  include: ["tests/integration/**/*.test.ts"], testTimeout: 30000, hookTimeout: 30000,
} });
