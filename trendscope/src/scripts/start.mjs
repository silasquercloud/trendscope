import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let child;
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
  });
}

function run(args) {
  return new Promise((resolveExit, reject) => {
    child = spawn(process.execPath, args, { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => resolveExit(stopping ? 0 : (code ?? 1)));
  });
}

try {
  if (process.env.RUN_DB_MIGRATIONS === "1") {
    if (
      !process.env.DATABASE_URL ||
      !process.env.BETTER_AUTH_URL ||
      (process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32
    ) {
      throw new Error(
        "Configure DATABASE_URL, BETTER_AUTH_URL e BETTER_AUTH_SECRET antes de ativar RUN_DB_MIGRATIONS.",
      );
    }
    console.log("Aplicando migrações antes de iniciar o servidor...");
    const status = await run(["--import", "tsx", resolve(root, "src/scripts/migrate.ts")]);
    if (status !== 0) throw new Error("Migração falhou. O servidor não será iniciado com esquema incompleto.");
  }
  if (!stopping) {
    process.exitCode = await run([resolve(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "0.0.0.0"]);
  }
} catch (error) {
  // Do not log environment values or database connection errors containing credentials.
  console.error(error instanceof Error ? error.message : "Falha ao iniciar o servidor.");
  process.exitCode = 1;
}
