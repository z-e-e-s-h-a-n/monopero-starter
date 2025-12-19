#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { fileURLToPath } from "url";
import { green, cyan, red } from "kolorist";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.log(red("❌ Please provide a project name"));
    console.log("Example:");
    console.log("  pnpm create zhx-monopero my-app");
    process.exit(1);
  }

  const projectPath = path.resolve(process.cwd(), targetDir);

  if (fs.existsSync(projectPath)) {
    console.log(red("❌ Directory already exists"));
    process.exit(1);
  }

  const { gitRemote } = await prompts({
    type: "text",
    name: "gitRemote",
    message: "Git remote URL (optional):",
  });

  console.log(cyan("📦 Creating project..."));

  // Copy template
  const templateDir = path.join(__dirname, "../templates/monorepo-starter");
  await fs.copy(templateDir, projectPath);

  // Update package.json
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.name = targetDir;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Init git
  process.chdir(projectPath);
  execSync("git init", { stdio: "ignore" });
  execSync("git add .", { stdio: "ignore" });
  execSync('git commit -m "Initial commit"', { stdio: "ignore" });

  if (gitRemote) {
    execSync(`git remote add origin ${gitRemote}`, { stdio: "ignore" });
  }

  console.log(green("✅ Project ready!"));
  console.log();
  console.log("Next steps:");
  console.log(`  cd ${targetDir}`);
  console.log("  pnpm install");
  console.log("  pnpm dev");
}

main();
