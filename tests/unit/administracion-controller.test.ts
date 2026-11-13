import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDominio } from "@/lib/errores";

vi.mock("server-only", () => ({}));
vi.mock("@/auth/perfil-operativo", () => ({ requerirPerfilOperativo: vi.fn() }));
vi.mock("@/repositorios/finanzas.repository", () => ({
  leerCategorias: vi.fn(), leerMovimientos: vi.fn(), leerReporte: vi.fn(), leerPerfiles: vi.fn(),
  leerBitacora: vi.fn(), leerUsuario: vi.fn(), persistirMovimiento: vi.fn(), persistirAnulacion: vi.fn(),
  persistirCategoria: vi.fn(), persistirUsuario: vi.fn(), persistirEstadoUsuario: vi.fn(),
}));

import { requerirPerfilOperativo } from "@/auth/perfil-operativo";
import { leerBitacora, leerPerfiles, leerUsuario, persistirEstadoUsuario, persistirUsuario } from "@/repositorios/finanzas.repository";
import { consultarAdministracion, consultarUsuario, ejecutarOperacion } from "@/controladores/finanzas.controller";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const perfil = { usuario_id: id, nombre: "Cuenta simulada", rol: "administrador" as const, activo: true, actualizado_en: "2026-11-12T12:00:00Z" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requerirPerfilOperativo).mockResolvedValue({ perfil, user: { email: "prueba@carlitos.local" } } as Awaited<ReturnType<typeof requerirPerfilOperativo>>);
  vi.mocked(leerPerfiles).mockResolvedValue({ perfiles: [], total: 0 });
  vi.mocked(leerBitacora).mockResolvedValue({ eventos: [], total: 0 });
});

describe("RF02 y RF10: separación de módulos", () => {
  it("Usuarios no carga actividad", async () => {
    expect((await consultarAdministracion("usuarios")).ok).toBe(true);
    expect(requerirPerfilOperativo).toHaveBeenCalledWith(true);
    expect(leerPerfiles).toHaveBeenCalled();
    expect(leerBitacora).not.toHaveBeenCalled();
  });

  it("Seguridad conserva los filtros de usuarios y consulta la bitácora por separado", async () => {
    await consultarAdministracion("bitacora", 2, undefined, undefined, { buscar: "prueba" });
    expect(leerPerfiles).toHaveBeenCalledWith(2, { buscar: "prueba" });
    expect(leerBitacora).not.toHaveBeenCalled();
    await consultarAdministracion("bitacora", 3, undefined, undefined, undefined, "bitacora");
    expect(leerBitacora).toHaveBeenCalledWith(3);
  });

  it("filtra la actividad en servidor por el usuario solicitado", async () => {
    vi.mocked(leerUsuario).mockResolvedValue({ ...perfil, correo: "prueba@carlitos.local", creado_en: perfil.actualizado_en });
    expect((await consultarUsuario(id, true, 2)).ok).toBe(true);
    expect(leerBitacora).toHaveBeenCalledWith(2, id);
  });

  it("rechaza al empleado antes de consultar identidades o actividad", async () => {
    vi.mocked(requerirPerfilOperativo).mockRejectedValue(new ErrorDominio("PERMISO_DENEGADO"));
    expect(await consultarUsuario(id, true)).toMatchObject({ ok: false, error: { codigo: "PERMISO_DENEGADO" } });
    expect(await ejecutarOperacion("usuario_estado", { id, versionEsperada: "version", activo: false }))
      .toMatchObject({ ok: false, error: { codigo: "PERMISO_DENEGADO" } });
    expect(leerUsuario).not.toHaveBeenCalled();
    expect(persistirEstadoUsuario).not.toHaveBeenCalled();
  });

  it("no consulta UUID malformados", async () => {
    expect(await consultarUsuario("no-es-un-id")).toMatchObject({ ok: false, error: { codigo: "RECURSO_NO_ENCONTRADO" } });
    expect(leerUsuario).not.toHaveBeenCalled();
  });

  it("la acción de estado no transmite nombre ni rol del navegador", async () => {
    vi.mocked(persistirEstadoUsuario).mockResolvedValue(id);
    expect((await ejecutarOperacion("usuario_estado", { id, versionEsperada: "version", activo: false, nombre: "Otro", rol: "administrador" })).ok).toBe(true);
    expect(persistirEstadoUsuario).toHaveBeenCalledWith({ id, versionEsperada: "version", activo: false });
  });

  it("la acción de información no transmite cambios de estado", async () => {
    vi.mocked(persistirUsuario).mockResolvedValue(id);
    await ejecutarOperacion("usuario", { id, versionEsperada: "version", nombre: "Cuenta simulada", rol: "empleado", activo: false });
    expect(persistirUsuario).toHaveBeenCalledWith({ id, versionEsperada: "version", nombre: "Cuenta simulada", rol: "empleado" });
  });
});
