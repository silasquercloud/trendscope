import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const file of ["package.json", "package-lock.json"]) {
  if (!existsSync(resolve(projectRoot, file)))
    throw new Error(`Missing ${file}. Render Root Directory must be trendscope.`);
}
const manifest = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(resolve(projectRoot, "package-lock.json"), "utf8"));
if (manifest.name !== "trendscope" || lock.name !== "trendscope") throw new Error("Unexpected application directory.");
if (Number(process.versions.node.split(".")[0]) !== 22)
  throw new Error("Render build requires Node.js 22. Set NODE_VERSION=22.23.3.");

function npm(args, capture = false) {
  const executable = process.env.npm_execpath;
  const command = executable ? process.execPath : "npm";
  const commandArgs = executable ? [executable, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    // Does not disable dependency lifecycle scripts; only developer Git hooks.
    env: { ...process.env, HUSKY: "0" },
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture) process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
  return result.stdout?.trim() ?? "";
}

console.log(`TrendScope Render build: Node ${process.version}; npm ${npm(["--version"], true)}`);
console.log(`Project directory: ${projectRoot}`);
const effectiveRoot = npm(["prefix"], true);
if (resolve(effectiveRoot) !== projectRoot) {
  throw new Error(
    "npm resolved a different project directory. Remove NPM_CONFIG_PREFIX overrides and set Render Root Directory to trendscope.",
  );
}
console.log(`Lockfile: package-lock.json (version ${lock.lockfileVersion})`);
// Only non-secret installation switches are logged, never a full env/config dump.
for (const option of ["omit", "include", "ignore-scripts", "workspaces"]) {
  console.log(`npm ${option}: ${npm(["config", "get", option], true) || "(empty)"}`);
}
console.log("Installing from the committed lockfile (including build tools)...");
npm(["ci", "--include=dev"]);
console.log("Building production application...");
npm(["run", "build"]);
