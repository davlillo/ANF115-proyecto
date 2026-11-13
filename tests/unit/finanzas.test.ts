import { describe, expect, it } from "vitest";
import { anchoComparativo } from "@/servicios/finanzas/resumen";
import { montoFinancieroSchema, filtroFinancieroSchema, movimientoSchema, anulacionSchema, usuarioSchema, estadoUsuarioSchema, contrasenaSchema } from "@/schemas/finanzas.schema";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";
import { readFileSync } from "node:fs";
import { hoyEnElSalvador } from "@/lib/fechas";

describe("RF07: indicadores operativos", () => {
  it("genera proporciones textuales para gráficos", () => {
    expect(anchoComparativo("9600", "12000")).toBe("80.00");
    expect(anchoComparativo("0", "0")).toBe("0.00");
  });
});

describe("RF02 y RF10: cuentas y seguridad", () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  it("acepta contraseñas de ocho caracteres y contraseñas más largas", () => {
    expect(contrasenaSchema.safeParse("Abcd123!").success).toBe(true);
    expect(contrasenaSchema.safeParse("Una contraseña mucho más larga").success).toBe(true);
    expect(contrasenaSchema.safeParse("Abc123!").success).toBe(false);
    expect(contrasenaSchema.safeParse("a".repeat(129)).success).toBe(false);
    expect(readFileSync("supabase/config.toml", "utf8")).toContain(`minimum_password_length = ${LONGITUD_MINIMA_CONTRASENA}`);
  });

  it("no admite cambiar el estado con la edición de información", () => {
    const usuario = usuarioSchema.parse({ id, versionEsperada: "2026-11-12T12:00:00Z", nombre: "Usuario de prueba", rol: "empleado", activo: false });
    expect(usuario).not.toHaveProperty("activo");
  });

  it("exige identidad, versión y estado para activar o desactivar", () => {
    expect(estadoUsuarioSchema.safeParse({ id, activo: false }).success).toBe(false);
    expect(estadoUsuarioSchema.parse({ id, versionEsperada: "version", activo: false, rol: "administrador" }))
      .toEqual({ id, versionEsperada: "version", activo: false });
  });
});

describe("RF04–RF06: entradas", () => {
  it("sugiere el día local sin cambiar las fechas ya capturadas", () => {
    expect(hoyEnElSalvador(new Date("2026-10-25T02:00:00Z"))).toBe("2026-10-24");
  });
  for (const v of ["0", "0.00", "-1", "1,25", "1,000.00", "1.001", "NaN", "Infinity", "1e2", "1000000000000", "01.00"])
    it(`rechaza monto ambiguo o inválido: ${v}`, () => expect(montoFinancieroSchema.safeParse(v).success).toBe(false));
  for (const v of ["0.01", "1", "25.50", "999999999999.99"])
    it(`acepta monto canónico: ${v}`, () => expect(montoFinancieroSchema.safeParse(v).success).toBe(true));
  it("rechaza fechas imposibles e invertidas", () => {
    expect(filtroFinancieroSchema.safeParse({ desde: "2026-02-30", hasta: "2026-03-01" }).success).toBe(false);
    expect(filtroFinancieroSchema.safeParse({ desde: "2026-10-31", hasta: "2026-10-01" }).success).toBe(false);
  });
  it("rechaza más de 3660 días", () => {
    expect(filtroFinancieroSchema.safeParse({ desde: "2000-01-01", hasta: "2026-01-01" }).success).toBe(false);
  });
  it("acepta estados de movimiento conocidos y rechaza otros", () => {
    const base = { desde: "2026-10-01", hasta: "2026-10-31" };
    expect(filtroFinancieroSchema.safeParse({ ...base, estado: "vigente" }).success).toBe(true);
    expect(filtroFinancieroSchema.safeParse({ ...base, estado: "anulado" }).success).toBe(true);
    expect(filtroFinancieroSchema.safeParse({ ...base, estado: "eliminado" }).success).toBe(false);
  });
  it("exige revisión al editar", () => {
    expect(movimientoSchema.safeParse({ tipo: "ingreso", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", solicitud_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", fecha: "2026-10-01", concepto: "Venta", monto: "25.00", categoria_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }).success).toBe(false);
  });
  it("exige motivo suficientemente descriptivo al anular", () => {
    expect(anulacionSchema.safeParse({ tipo: "gasto", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", revision: 1, motivo: "no" }).success).toBe(false);
  });
});
