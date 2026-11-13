#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";

/** Explicit local-only maintenance. Never logs credentials or creates movements. */
async function main() {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("="); const key = line.slice(0, i).trim();
    process.env[key] ??= line.slice(i + 1).trim();
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ADMIN_KEY;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!url || !key || !password || process.env.DEMO_SEED_ENABLED !== "true")
    throw new Error("Configure URL, credencial administrativa, DEMO_USER_PASSWORD y DEMO_SEED_ENABLED=true.");
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("La preparación demo solo puede ejecutarse contra Supabase local.");
  if (password.length < LONGITUD_MINIMA_CONTRASENA) throw new Error(`DEMO_USER_PASSWORD requiere al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error("No se pudo consultar Auth local.");
  for (const [email, nombre, rol] of [
    ["admin@carlitos.local", "Administración Carlitos", "administrador"],
    ["empleado@carlitos.local", "Karla Girón", "empleado"],
  ]) {
    let id = data.users.find((u) => u.email === email)?.id;
    if (!id) {
      const result = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } });
      if (result.error || !result.data.user) throw new Error(`No se pudo crear ${email}.`);
      id = result.data.user.id;
    } else {
      const result = await admin.auth.admin.updateUserById(id, { password, email_confirm: true });
      if (result.error) throw new Error(`No se pudo actualizar ${email}.`);
    }
    // Maintenance connects as postgres locally, not through a privileged browser client.
    // UUID is validated and names/roles come exclusively from the constants above.
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("UUID de Auth inválido.");
    const sql = `update public.perfiles set nombre='${nombre}',rol='${rol}',activo=true where usuario_id='${id}' returning usuario_id;`;
    const output = execFileSync("docker", ["exec", "supabase_db_carlitos-finanzas", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-Atc", sql], { encoding: "utf8" });
    if (!output.includes(id)) throw new Error(`Falta el perfil operativo de ${email}. Aplique primero las migraciones.`);
    console.log(`Listo: ${email} (${rol})`);
  }
  console.log("Cuentas demo locales preparadas. La contraseña no se imprime.");
}
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : "Error inesperado"); process.exitCode = 1; });
