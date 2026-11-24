import { describe, expect, it } from "vitest";
import {
  esPermisoConocido,
  PERMISOS,
  PERMISOS_POR_ROL,
  ROLES,
  rolTienePermiso,
} from "@/config/permisos";

describe("permisos", () => {
  it("define 16 codigos unicos", () => {
    const valores = Object.values(PERMISOS);
    expect(valores).toHaveLength(16);
    expect(new Set(valores).size).toBe(16);
    expect(valores).toContain("finanzas.leer");
    expect(valores).toContain("panel.leer");
  });

  it("reserva las vistas consolidadas para los roles de analisis", () => {
    expect(rolTienePermiso(ROLES.administrador, "panel.leer")).toBe(true);
    expect(rolTienePermiso(ROLES.empleado, "panel.leer")).toBe(false);
    expect(rolTienePermiso(ROLES.empleado, "finanzas.leer")).toBe(true);
  });

  it("asigna la matriz inicial por rol", () => {
    expect(rolTienePermiso(ROLES.administrador, "usuarios.gestionar")).toBe(
      true,
    );
    expect(rolTienePermiso(ROLES.administrador, "asientos.aprobar")).toBe(true);
    expect(rolTienePermiso(ROLES.administrador, "importaciones.preparar")).toBe(
      false,
    );

    expect(rolTienePermiso(ROLES.analista, "asientos.preparar")).toBe(true);
    expect(rolTienePermiso(ROLES.analista, "asientos.aprobar")).toBe(false);

    expect(rolTienePermiso(ROLES.gerencia, "presupuestos.aprobar")).toBe(true);
    expect(rolTienePermiso(ROLES.gerencia, "presupuestos.preparar")).toBe(false);
    expect(rolTienePermiso(ROLES.gerencia, "auditoria.leer")).toBe(false);
  });

  it("todo rol conserva lectura financiera", () => {
    for (const rol of Object.values(ROLES)) {
      expect(PERMISOS_POR_ROL[rol]).toContain("finanzas.leer");
    }
  });

  it("reconoce solo codigos del catalogo", () => {
    expect(esPermisoConocido("periodos.cerrar")).toBe(true);
    expect(esPermisoConocido("periodos.borrar")).toBe(false);
    expect(esPermisoConocido("")).toBe(false);
  });
});
