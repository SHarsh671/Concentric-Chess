import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));
const doGitignorePath = fileURLToPath(
  new URL("do/.gitignore", import.meta.url),
);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/",
    "node_modules/",
    ".open-next/",
    "cypress.config.ts",
    "cloudflare-env.d.ts",
  ]),
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  includeIgnoreFile(doGitignorePath, "Imported .gitignore patterns"),
];

export default eslintConfig;
