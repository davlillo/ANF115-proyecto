import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/)
  .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
  .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const base = process.env.E2E_ORIGIN ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local E2E only");
if (!["localhost", "127.0.0.1"].includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname)) throw new Error("Local Supabase only");
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL });
const errors = [];
try {
  for (const [email, rol] of [["admin@carlitos.local", "administrador"], ["empleado@carlitos.local", "empleado"]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/login`);
    await page.getByLabel(/Correo/i).fill(email);
    await page.locator('input[name="contrasena"]').fill(env.DEMO_USER_PASSWORD);
    await page.getByRole("button", { name: "Entrar al sistema" }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("heading", { name: "Panel financiero", exact: true }).waitFor();
    await page.screenshot({ path: `test-results/panel-${rol}-desktop.png` });
    const links = await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link").allTextContents();
    assert.equal(links.length, rol === "administrador" ? 7 : 5);
    for (const [path, title] of [["ingresos", "Ingresos"], ["gastos", "Gastos"], ["categorias", "Categorías"], ["reportes", "Reportes"]]) {
      await page.goto(`${base}/${path}`);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      const alerts = (await page.getByRole("alert").allTextContents()).map((s) => s.trim()).filter(Boolean);
      assert.deepEqual(alerts, [], `${path}: ${alerts}`);
    }
    for (const [path, tipo] of [["ingresos", "ingreso"], ["gastos", "gasto"]]) {
      await page.goto(`${base}/${path}`);
      const concepto = `E2E SIMULADO ${rol} ${tipo} ${Date.now()}`;
      const alta = page.locator("#nueva-captura form");
      await alta.getByLabel(/^Concepto/).fill(concepto);
      await alta.getByLabel(/^Monto/).fill("25.50");
      await alta.getByLabel(/^Categoría/).selectOption({ index: 1 });
      await alta.getByRole("button", { name: `Guardar ${tipo}` }).click();
      await alta.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      const row = page.getByRole("row").filter({ hasText: concepto });
      await row.waitFor();
      assert.ok((await row.innerText()).includes("$25.50"));
      await row.getByRole("button", { name: "Anular", exact: true }).click();
      const anular = page.locator("form").filter({ has: page.getByLabel(/Motivo de anulación/) });
      await anular.getByLabel(/Motivo de anulación/).fill("Cierre de prueba E2E con datos simulados");
      await anular.getByRole("button", { name: "Confirmar anulación" }).click();
      await row.getByText("Anulado", { exact: true }).waitFor();
      await page.getByLabel("Estado").selectOption("anulado");
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL("**estado=anulado**");
      await page.getByRole("row").filter({ hasText: concepto }).waitFor();
      console.log(`PASS: ${rol} ${tipo} create, void and status filter through browser`);
    }
    await page.goto(`${base}/usuarios`);
    if (rol === "administrador") {
      await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
      await page.getByText("Registrar usuario", { exact: true }).click();
      const alta = page.locator("details").first().locator("form");
      const nombre = `E2E SIMULADO usuario ${Date.now()}`;
      await alta.getByLabel("Nombre", { exact: true }).fill(nombre);
      await alta.getByLabel("Correo", { exact: true }).fill(`e2e-${Date.now()}@carlitos.local`);
      await alta.getByLabel(/Contraseña/).fill(env.DEMO_USER_PASSWORD);
      await alta.getByLabel("Estado", { exact: true }).selectOption("true");
      await alta.getByRole("button", { name: "Crear cuenta", exact: true }).click();
      await alta.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      const usuario = page.getByRole("row").filter({ hasText: nombre });
      await usuario.getByRole("switch", { name: `Desactivar ${nombre}` }).click();
      await usuario.getByRole("switch", { name: `Activar ${nombre}` }).waitFor();
      assert.ok((await usuario.innerText()).includes("Inactivo"));
      await page.goto(`${base}/categorias`);
      await page.locator("summary").filter({ hasText: "Nueva categoría" }).click();
      const categoriaForm = page.locator("details").first().locator("form");
      const categoriaNombre = `E2E SIMULADO categoría ${Date.now()}`;
      let codigo;
      do { codigo = `I${Math.floor(1000 + Math.random() * 9000)}`; }
      while (await page.getByText(codigo, { exact: true }).count());
      await categoriaForm.getByLabel(/Código/).fill(codigo);
      await categoriaForm.getByLabel("Nombre", { exact: true }).fill(categoriaNombre);
      await categoriaForm.getByRole("button", { name: "Crear categoría", exact: true }).click();
      await categoriaForm.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      const categoria = page.getByRole("article").filter({ hasText: categoriaNombre });
      await categoria.getByRole("switch", { name: `Desactivar ${categoriaNombre}` }).click();
      await categoria.getByRole("switch", { name: `Activar ${categoriaNombre}` }).waitFor();
      assert.ok((await categoria.innerText()).includes("Inactiva"));
      await page.goto(`${base}/categorias?tipo=ingreso&estado=inactiva`);
      await page.getByRole("article").filter({ hasText: categoriaNombre }).waitFor();
      await page.goto(`${base}/auditoria`);
      await page.getByRole("heading", { name: "Seguridad y bitácora", exact: true }).waitFor();
      assert.ok(await page.getByRole("table").count());
      console.log("PASS: administrator creates/deactivates users and categories; audit readable");
    }
    else {
      assert.ok((await page.getByRole("alert").allTextContents()).some((s) => s.includes("permiso")));
      await page.goto(`${base}/categorias?tipo=ingreso`);
      let categorias = await page.getByRole("article").allTextContents();
      assert.ok(categorias.length > 0 && categorias.every((texto) => texto.includes("Ingreso") && !texto.includes("Inactiva")));
      await page.goto(`${base}/categorias?tipo=gasto`);
      categorias = await page.getByRole("article").allTextContents();
      assert.ok(categorias.length > 0 && categorias.every((texto) => texto.includes("Gasto") && !texto.includes("Inactiva")));
      console.log("PASS: empleado consulta categorías activas filtradas por tipo");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/dashboard`);
    await page.getByRole("heading", { name: "Panel financiero", exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: `test-results/panel-${rol}-mobile.png` });
    await page.getByRole("button", { name: "Abrir menu de navegacion" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Reportes", exact: true }).click();
    await page.getByRole("heading", { name: "Reportes", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await context.close();
    console.log(`PASS: ${rol} login, routes, permissions and mobile layout`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
