import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.resolve(__dirname, "../prisma/schema.prisma");
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/modules/prisma/soft-delete.models.ts"
);

const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

// Normalize line endings for consistency
const normalizedSchema = schema.replace(/\r\n/g, "\n");

// Match full model blocks (multiline-safe)
const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)^\s*\}/gm;

const softDeleteModels: string[] = [];
let totalModels = 0;

let match: RegExpExecArray | null;
while ((match = modelRegex.exec(normalizedSchema))) {
  const modelName = match[1] as string;
  const body = match[2] as string;
  totalModels++;

  const hasDeletedAt = /deletedAt\s+DateTime\?/i.test(body);

  if (hasDeletedAt) {
    softDeleteModels.push(modelName);
  }
}

// Generate the output file
const output = `// AUTO-GENERATED FILE — DO NOT EDIT
// Generated from schema.prisma

export const SoftDeleteModels = new Set<string>([
${softDeleteModels.map((m) => `  "${m}"`).join(",\n")}
]);
`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");

console.log(
  `✅ Generated soft delete models (${softDeleteModels.length}/${totalModels} models):`,
  softDeleteModels.join(", ")
);
