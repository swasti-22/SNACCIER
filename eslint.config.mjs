import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    ".firebase/**",
    "out/**",
    "build/**",
    "snaccier-web-backup/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
