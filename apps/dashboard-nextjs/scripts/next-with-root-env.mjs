import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(scriptDir, "../../..", ".env");
const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);

function unquote(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === "\"" || quote === "'") && trimmed.at(-1) === quote) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadRootEnv() {
  if (!existsSync(rootEnvPath)) {
    return;
  }

  const contents = readFileSync(rootEnvPath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    const value = normalized.slice(separatorIndex + 1);

    if (!process.env[key]) {
      process.env[key] = unquote(value);
    }
  }
}

loadRootEnv();

// In DEMO_MODE the dashboard never touches Supabase, so missing keys are expected.
const isDemoMode = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

if (!isDemoMode && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error(
    `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY after loading ${rootEnvPath}.`
  );
}

const nextBin = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(nextBin, [command, ...args], {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
