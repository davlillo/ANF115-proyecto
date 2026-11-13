import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { limpiarSimulaciones } from "./limpiar-simulaciones.mjs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/)
  .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
  .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const base = process.env.E2E_ORIGIN ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local E2E only");
if (!["localhost", "127.0.0.1"].includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname)) throw new Error("Local Supabase only");
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.E2E_BROWSER_CHANNEL });
const errors = [];
const simulaciones = { movimientos: [], usuarios: [], categorias: [] };
try {
  for (const [email, rol] of [["admin@carlitos.local", "administrador"], ["empleado@carlitos.local", "empleado"]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    let etapa = "login";
    page.on("pageerror", (error) => errors.push({ rol, etapa, pagina: page.url(), mensaje: error.message }));
    await page.goto(`${base}/login`);
    for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Login must fit the viewport");
      await page.screenshot({ path: `test-results/login-${viewport.width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByLabel(/Correo/i).fill(email);
    if (rol === "administrador") {
      await page.locator('input[name="contrasena"]').fill("Invalid-E2E-password");
      await page.getByRole("button", { name: "Mostrar contraseña" }).click();
      assert.equal(await page.locator('input[name="contrasena"]').getAttribute("type"), "text");
      await page.getByRole("button", { name: "Ocultar contraseña" }).click();
      await page.getByRole("button", { name: "Entrar al sistema" }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.getByLabel(/Correo/i).inputValue(), email, "Failed login preserves the email");
    }
    await page.locator('input[name="contrasena"]').fill(env.DEMO_USER_PASSWORD);
    etapa = "panel inicial";
    await page.getByRole("button", { name: "Entrar al sistema" }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("heading", { name: "Panel financiero", exact: true }).waitFor();
    assert.equal(await page.getByRole("region", { name: "Gráficos financieros" }).getByRole("article").count(), 4);
    assert.equal(await page.getByRole("heading", { name: "Detalle de movimientos" }).count(), 0);
    assert.equal(await page.locator("header").getByText("Datos simulados", { exact: true }).count(), 0);
    await page.screenshot({ path: `test-results/panel-${rol}-desktop.png` });
    const links = await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link").allTextContents();
    assert.equal(links.length, rol === "administrador" ? 7 : 5);
    for (const [path, title] of [["ingresos", "Ingresos"], ["gastos", "Gastos"], ["categorias", "Categorías"], ["reportes", "Reportes"]]) {
      etapa = path;
      await page.goto(`${base}/${path}`);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      const alerts = (await page.getByRole("alert").allTextContents()).map((s) => s.trim()).filter(Boolean);
      assert.deepEqual(alerts, [], `${path}: ${alerts}`);
      if (path === "ingresos" || path === "gastos") {
        assert.equal(await page.getByRole("region", { name: "Indicadores financieros" }).count(), 0);
        assert.equal(await page.getByRole("link", { name: /^Registrar/ }).count(), 0);
      }
    }
    for (const [path, tipo] of [["ingresos", "ingreso"], ["gastos", "gasto"]]) {
      etapa = `operación ${tipo}`;
      await page.goto(`${base}/${path}`);
      const concepto = `E2E SIMULADO ${rol} ${tipo} ${Date.now()}`;
      const alta = page.locator("#nueva-captura form");
      const solicitud = await alta.locator('input[name="solicitud_id"]').inputValue();
      if (tipo === "gasto" && rol === "administrador") {
        const selector = alta.getByLabel(/^Categoría/);
        await selector.click();
        await page.screenshot({ path: "test-results/selector-categorias.png" });
        await page.keyboard.press("Escape");
        if (await page.evaluate(() => CSS.supports("appearance", "base-select"))) {
          assert.equal(await selector.evaluate((elemento) => getComputedStyle(elemento).appearance), "base-select");
          assert.equal(await selector.evaluate((elemento) => getComputedStyle(elemento, "::picker(select)").borderRadius), "12px");
        }
      }
      await alta.getByLabel(/^Concepto/).fill(concepto);
      await alta.getByLabel(/^Monto/).fill("0");
      await alta.getByLabel(/^Categoría/).selectOption({ index: 1 });
      await alta.getByRole("button", { name: `Guardar ${tipo}` }).click();
      await alta.getByRole("status").filter({ hasText: "Revise" }).waitFor();
      assert.equal(await alta.getByLabel(/^Concepto/).inputValue(), concepto);
      assert.equal(await alta.locator('input[name="solicitud_id"]').inputValue(), solicitud, "Retry keeps its identity");
      await alta.getByLabel(/^Monto/).fill("25.50");
      simulaciones.movimientos.push({ tipo, concepto });
      await alta.getByRole("button", { name: `Guardar ${tipo}` }).click();
      await alta.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      const row = page.getByRole("row").filter({ hasText: concepto });
      await row.waitFor();
      assert.ok((await row.innerText()).includes("$25.50"));
      assert.equal(await alta.getByLabel(/^Concepto/).inputValue(), "");
      assert.equal(await alta.getByLabel(/^Monto/).inputValue(), "");
      assert.equal(await alta.getByLabel(/^Categoría/).inputValue(), "");
      assert.notEqual(await alta.locator('input[name="solicitud_id"]').inputValue(), solicitud);
      assert.equal(await page.getByText(/Continuar con/).count(), 0);
      const segundo = `${concepto} consecutivo`;
      simulaciones.movimientos.push({ tipo, concepto: segundo });
      await alta.getByLabel(/^Concepto/).fill(segundo);
      await alta.getByLabel(/^Monto/).fill("26.75");
      await alta.getByLabel(/^Categoría/).selectOption({ index: 1 });
      await alta.getByRole("button", { name: `Guardar ${tipo}` }).click();
      await page.getByRole("row").filter({ hasText: segundo }).waitFor();
      if (tipo === "ingreso") {
        etapa = "panel con datos";
        await page.goto(`${base}/dashboard`);
        await page.getByRole("region", { name: "Gráficos financieros" }).getByRole("img").first().waitFor();
        assert.equal(await page.getByRole("region", { name: "Gráficos financieros" }).getByRole("img").count(), 4);
        await page.screenshot({ path: `test-results/panel-${rol}-con-datos.png` });
        await page.goto(`${base}/${path}`);
        etapa = `anulación ${tipo}`;
      }
      for (const nombre of [concepto, segundo]) {
        const registro = page.getByRole("row").filter({ has: page.getByText(nombre, { exact: true }) });
        await registro.getByRole("button", { name: "Anular", exact: true }).click();
        const anular = page.locator("form").filter({ has: page.getByLabel(/Motivo de anulación/) });
        await anular.getByLabel(/Motivo de anulación/).fill("Cierre de prueba E2E con datos simulados");
        await anular.getByRole("button", { name: "Confirmar anulación" }).click();
        const detalle = registro.getByRole("button", { name: "Ver detalle", exact: true });
        await detalle.waitFor();
        assert.equal(await detalle.getAttribute("aria-expanded"), "false", "Annulment closes its detail");
        await detalle.click();
        await page.getByText("Cierre de prueba E2E con datos simulados", { exact: true }).waitFor();
        await registro.getByRole("button", { name: "Cancelar", exact: true }).click();
      }
      await page.getByLabel("Estado").selectOption("anulado");
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL("**estado=anulado**");
      await page.getByRole("row").filter({ has: page.getByText(concepto, { exact: true }) }).waitFor();
      console.log(`PASS: ${rol} ${tipo} create, void and status filter through browser`);
    }
    etapa = "usuarios";
    await page.goto(`${base}/usuarios`);
    if (rol === "administrador") {
      await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
      await page.locator("summary").filter({ hasText: "Registrar usuario" }).click();
      const alta = page.locator("details").first().locator("form");
      const nombre = `E2E SIMULADO usuario ${Date.now()}`;
      await alta.getByLabel("Nombre", { exact: true }).fill(nombre);
      await alta.getByLabel("Correo", { exact: true }).fill(`e2e-${Date.now()}@carlitos.local`);
      const nuevoCorreo = await alta.getByLabel("Correo", { exact: true }).inputValue();
      const passwordCorto = `${crypto.randomUUID().slice(0, 4)}Aa9!`;
      await alta.getByLabel(/Contraseña/).fill(passwordCorto);
      assert.equal(await alta.getByLabel("Estado", { exact: true }).count(), 0);
      await alta.getByRole("button", { name: "Crear cuenta", exact: true }).click();
      await alta.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      await page.goto(`${base}/usuarios?buscar=${encodeURIComponent(nombre)}`);
      const usuario = page.getByRole("row").filter({ hasText: nombre });
      await usuario.waitFor();
      assert.equal(await usuario.getByRole("switch").count(), 0);
      const gestionar = usuario.getByRole("link", { name: `Gestionar ${nombre}` });
      simulaciones.usuarios.push((await gestionar.getAttribute("href")).split("/").at(-1));
      await gestionar.click();
      await page.waitForURL(/\/usuarios\/[a-f0-9-]+$/);
      assert.equal(await page.getByRole("switch").count(), 0);
      assert.equal(await page.getByRole("heading", { name: /^Actividad/ }).count(), 0);
      const editar = page.locator('form:visible:has(input[name="operacion"][value="usuario"])');
      assert.equal(await editar.getByRole("button", { name: "Guardar cambios" }).isDisabled(), true);
      const nombreEditado = `${nombre} editado`;
      await editar.getByLabel("Nombre", { exact: true }).fill(nombreEditado);
      await editar.getByLabel("Rol", { exact: true }).selectOption("administrador");
      await editar.getByRole("button", { name: "Guardar cambios" }).click();
      await editar.getByRole("status").filter({ hasText: "Operación confirmada" }).waitFor();
      await editar.getByRole("button", { name: "Guardando…", exact: true }).waitFor({ state: "hidden" });
      assert.equal(await editar.getByLabel("Rol", { exact: true }).inputValue(), "administrador");
      await page.screenshot({ path: "test-results/usuario-editar.png" });
      const nuevaSesion = await browser.newContext();
      const nuevoLogin = await nuevaSesion.newPage();
      nuevoLogin.on("pageerror", (error) => errors.push({ rol, etapa: "sesión de usuario nuevo", pagina: nuevoLogin.url(), mensaje: error.message }));
      await nuevoLogin.goto(`${base}/login`);
      await nuevoLogin.getByLabel(/Correo/).fill(nuevoCorreo);
      await nuevoLogin.locator('input[name="contrasena"]').fill(passwordCorto);
      await nuevoLogin.getByRole("button", { name: "Entrar al sistema" }).click();
      await nuevoLogin.waitForURL("**/dashboard");
      await nuevoLogin.getByRole("heading", { name: "Panel financiero", exact: true }).waitFor();
      await page.goto(`${base}/auditoria?buscar=${encodeURIComponent(nombreEditado)}`);
      await page.getByRole("row").filter({ hasText: nombreEditado }).getByRole("link", { name: `Ver seguridad de ${nombreEditado}` }).click();
      await page.waitForURL(/\/auditoria\/usuarios\/[a-f0-9-]+$/);
      await page.getByRole("heading", { name: `Actividad de ${nombreEditado}` }).waitFor();
      await page.screenshot({ path: "test-results/usuario-seguridad.png" });
      await page.getByRole("switch", { name: `Desactivar ${nombreEditado}`, exact: true }).click();
      await page.getByRole("switch", { name: `Activar ${nombreEditado}`, exact: true }).waitFor();
      await nuevoLogin.goto(`${base}/dashboard`);
      try {
        await nuevoLogin.getByRole("heading", { name: "Acceso pendiente", exact: true })
          .or(nuevoLogin.getByRole("alert").filter({ hasText: /permiso|sesión/i })).first().waitFor();
      } catch (error) {
        await nuevoLogin.screenshot({ path: "test-results/usuario-desactivado-error.png", fullPage: true });
        throw error;
      }
      assert.equal(await nuevoLogin.getByRole("region", { name: "Indicadores financieros" }).count(), 0);
      await nuevoLogin.screenshot({ path: "test-results/usuario-desactivado.png" });
      await nuevaSesion.close();
      await page.goto(`${base}/categorias`);
      assert.equal(await page.getByText("Guía para clasificar movimientos").count(), 0);
      await page.getByRole("button", { name: "Nueva categoría", exact: true }).click();
      const categoriaForm = page.getByRole("dialog").locator("form");
      const categoriaNombre = `E2E SIMULADO categoría ${Date.now()}`;
      let codigo;
      do { codigo = `I${Math.floor(1000 + Math.random() * 9000)}`; }
      while (await page.getByText(codigo, { exact: true }).count());
      await categoriaForm.getByLabel(/Código/).fill(codigo);
      await categoriaForm.getByLabel("Nombre", { exact: true }).fill(categoriaNombre);
      simulaciones.categorias.push({ codigo, nombre: categoriaNombre });
      await categoriaForm.getByRole("button", { name: "Crear categoría", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
      const categoria = page.getByRole("article").filter({ hasText: categoriaNombre });
      await categoria.getByRole("button", { name: "Editar", exact: true }).click();
      const modal = page.getByRole("dialog");
      await modal.waitFor();
      const bounds = await modal.boundingBox();
      assert.ok(Math.abs(bounds.x + bounds.width / 2 - 720) < 2, "Category editor is centered");
      await page.screenshot({ path: "test-results/categoria-modal.png" });
      assert.equal(await modal.getByRole("button", { name: "Guardar cambios" }).isDisabled(), true);
      await modal.getByLabel("Descripción", { exact: true }).fill("Categoría de prueba editada desde el modal central");
      await modal.getByRole("button", { name: "Guardar cambios" }).click();
      await modal.waitFor({ state: "detached" });
      await categoria.getByText("Categoría de prueba editada desde el modal central").waitFor();
      await categoria.getByRole("switch", { name: `Desactivar ${categoriaNombre}`, exact: true }).click();
      await categoria.getByRole("switch", { name: `Activar ${categoriaNombre}`, exact: true }).waitFor();
      await categoria.getByText("Inactiva", { exact: true }).waitFor();
      await page.goto(`${base}/categorias?tipo=ingreso&estado=inactiva`);
      await page.getByRole("article").filter({ hasText: categoriaNombre }).waitFor();
      await page.goto(`${base}/auditoria`);
      await page.getByRole("heading", { name: "Seguridad y bitácora", exact: true }).waitFor();
      await page.getByRole("link", { name: "Bitácora general", exact: true }).click();
      await page.getByRole("columnheader", { name: "Fecha y hora", exact: true }).waitFor();
      assert.ok(await page.getByRole("table").count());
      await page.screenshot({ path: "test-results/bitacora-administrador.png" });
      console.log("PASS: eight-character accounts, dedicated user editing, security-only activation, centered category modals and audit");
    }
    else {
      await page.getByRole("alert").filter({ hasText: "permiso" }).waitFor();
      await page.goto(`${base}/auditoria/usuarios/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`);
      await page.getByRole("alert").filter({ hasText: "permiso" }).waitFor();
      await page.goto(`${base}/categorias?tipo=ingreso`);
      await page.getByRole("article").first().waitFor();
      let categorias = await page.getByRole("article").allTextContents();
      assert.ok(categorias.length > 0 && categorias.every((texto) => texto.includes("Ingreso") && !texto.includes("Inactiva")));
      await page.goto(`${base}/categorias?tipo=gasto`);
      await page.getByRole("article").first().waitFor();
      categorias = await page.getByRole("article").allTextContents();
      assert.ok(categorias.length > 0 && categorias.every((texto) => texto.includes("Gasto") && !texto.includes("Inactiva")));
      console.log("PASS: empleado consulta categorías activas filtradas por tipo");
    }
    etapa = "panel móvil";
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
} finally {
  try { await limpiarSimulaciones(env, simulaciones); }
  finally { await browser.close(); }
}
