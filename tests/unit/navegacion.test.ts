import { describe, expect, it } from "vitest";
import {
  filtrarNavegacion,
  navegacion,
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

  it("limita el menú del empleado y conserva sus consultas", () => {
    const grupos = filtrarNavegacion(["finanzas.leer"]);
    const items = grupos.flatMap((grupo) => grupo.items.map((item) => item.href));

    expect(items).toContain("/ingresos");
    expect(items).toContain("/gastos");
    expect(items).toContain("/categorias");
    expect(items).toContain("/dashboard");
    expect(items).toContain("/reportes");
    expect(items).not.toContain("/usuarios");
    expect(items).not.toContain("/auditoria");
  });

  it("sin permisos no expone módulos operativos", () => {
    const grupos = filtrarNavegacion([]);
    const items = grupos.flatMap((grupo) => grupo.items);

    expect(items).toHaveLength(0);
  });
});
