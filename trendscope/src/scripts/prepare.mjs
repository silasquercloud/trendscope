import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Git hooks belong to a developer's checkout, not to a source-only production build.
if (process.env.HUSKY === "0" || process.env.CI || process.env.RENDER || process.env.NODE_ENV === "production") {
  console.log("Skipping Git hooks in CI/production.");
} else {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  if (!existsSync(resolve(repositoryRoot, ".git"))) {
    console.log("Skipping Git hooks: this is not a Git checkout.");
  } else {
    const { default: husky } = await import("husky");
    process.chdir(repositoryRoot);
    const message = husky(".husky");
    if (message) throw new Error(message);
  }
}
