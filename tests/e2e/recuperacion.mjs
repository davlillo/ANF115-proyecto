import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/)
  .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
  .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!["127.0.0.1", "localhost"].includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname)) throw new Error("Local test only");
const base = "http://localhost:3000";
const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL });
const auth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_ADMIN_KEY, { auth: { persistSession: false } });
const { data: users } = await auth.auth.admin.listUsers();
const usuario = users.users.find((u) => u.email === "empleado@carlitos.local");
assert.ok(usuario);
try {
  const page = await browser.newPage();
  await page.goto(`${base}/recuperar-acceso`);
  await page.getByLabel("Correo de la cuenta").fill(usuario.email);
  await page.getByRole("button", { name: "Enviar enlace", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Si la cuenta existe" }).waitFor();
  const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
  const mensajes = await response.json();
  const mensaje = mensajes.messages.find((m) => m.To?.some((to) => to.Address === usuario.email));
  assert.ok(mensaje, "Recovery email should arrive in local Mailpit");
  const contenido = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${mensaje.ID}`)).json();
  const html = contenido.HTML ?? contenido.Text ?? "";
  const match = html.match(/href="([^"]*token_hash=[^"]+)"/);
  assert.ok(match, "Recovery template must use token_hash, not an implicit-flow fragment");
  const link = match[1].replaceAll("&amp;", "&");
  assert.equal(new URL(link).origin, base);
  await page.goto(link);
  await page.waitForURL("**/restablecer-acceso");
  const password = `${crypto.randomUUID().slice(0, 4)}Aa9!`;
  await page.getByLabel("Nueva contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Actualizar contraseña", exact: true }).click();
  await page.waitForURL("**/login");
  await page.getByRole("heading", { name: "Inicia sesión", exact: true }).waitFor();
  await page.getByLabel(/Correo electrónico/).fill(usuario.email);
  await page.locator("#contrasena").fill(password);
  await page.getByRole("button", { name: "Entrar al sistema" }).click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("heading", { name: "Panel financiero", exact: true }).waitFor();
  const replay = await browser.newPage();
  await replay.goto(link);
  await replay.waitForURL("**/recuperar-acceso");
  console.log("PASS: recovery email, one-use token, password reset and login with changed password");
} finally {
  const { error } = await auth.auth.admin.updateUserById(usuario.id, { password: env.DEMO_USER_PASSWORD });
  assert.equal(error, null);
  await browser.close();
}
