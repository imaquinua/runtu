import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL_UNPOOLED o DATABASE_URL es obligatorio.");

const outputPath = "/private/tmp/runtu-runtime-database-url";
const password = existsSync(outputPath)
  ? new URL(readFileSync(outputPath, "utf8").trim()).password
  : randomBytes(32).toString("hex");
const migrationsDirectory = fileURLToPath(new URL("../db/migrations", import.meta.url));

try {
  const migrations = readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql')).sort();
  for (const migration of migrations) {
    execFileSync("psql", [adminUrl, "-v", `role_password=${password}`, "-f", `${migrationsDirectory}/${migration}`], {
      stdio: ["ignore", "inherit", "inherit"],
    });
  }
} catch {
  throw new Error("No se pudo aplicar la migración de Neon. El detalle sensible fue omitido.");
}

const runtimeUrl = new URL(adminUrl);
runtimeUrl.username = "runtu_app";
runtimeUrl.password = password;
writeFileSync(outputPath, runtimeUrl.toString(), { mode: 0o600 });
chmodSync(outputPath, 0o600);
console.log(`Runtime de Runtu provisionado. URL protegida en ${outputPath}`);
