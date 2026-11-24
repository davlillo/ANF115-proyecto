import { describe, expect, it } from "vitest";
import {
  filtrarNavegacion,
  navegacion,
  rutaInicial,
} from "@/config/navegacion";

describe("navegacion", () => {
  it("presenta los siete módulos agrupados en Resumen, Operación y Administración", () => {
    expect(navegacion.flatMap((grupo) => grupo.items.map((i) => i.titulo))).toEqual([
      "Panel financiero", "Reportes", "Ingresos", "Gastos", "Categorías", "Usuarios", "Seguridad y bitácora",
    ]);
  });

  it("usa rutas absolutas y sin duplicados", () => {
    const hrefs = [
      ...navegacion.flatMap((grupo) => grupo.items.map((item) => item.href)),
    ];

    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
    }

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("deja al empleado solo Ingresos, Gastos y Categorías", () => {
    const grupos = filtrarNavegacion(["finanzas.leer"]);
    const items = grupos.flatMap((grupo) => grupo.items.map((item) => item.href));

    expect(items).toEqual(["/ingresos", "/gastos", "/categorias"]);
    expect(items).not.toContain("/dashboard");
    expect(items).not.toContain("/reportes");
    expect(items).not.toContain("/usuarios");
    expect(items).not.toContain("/auditoria");
  });

  it("mantiene los siete módulos para el administrador", () => {
    const grupos = filtrarNavegacion([
      "finanzas.leer",
      "panel.leer",
      "usuarios.gestionar",
      "auditoria.leer",
    ]);
    const items = grupos.flatMap((grupo) => grupo.items.map((item) => item.href));

    expect(items).toHaveLength(7);
    expect(items).toContain("/dashboard");
    expect(items).toContain("/reportes");
  });

  it("sin permisos no expone módulos operativos", () => {
    const grupos = filtrarNavegacion([]);
    const items = grupos.flatMap((grupo) => grupo.items);

    expect(items).toHaveLength(0);
  });

  it("envía al empleado a Ingresos y al administrador al panel", () => {
    expect(rutaInicial(["finanzas.leer"])).toBe("/ingresos");
    expect(rutaInicial(["finanzas.leer", "panel.leer"])).toBe("/dashboard");
  });
});
