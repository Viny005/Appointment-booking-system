import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals, ...nextTs,
  globalIgnores([".next/**", "src/generated/**", "coverage/**", "next-env.d.ts"]),
  {
    files: ["src/**/domain/**/*.ts", "src/**/application/**/*.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [
      { group: ["next", "next/**", "react", "react/**", "@prisma/**", "better-auth", "better-auth/**", "**/infrastructure/**", "**/generated/**", "**/web/**"], message: "Domain/Application use framework-independent values and ports." }
    ] }] }
  }
]);
