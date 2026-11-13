import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/supabase/proxy", () => ({ actualizarSesion: vi.fn() }));

import { actualizarSesion } from "@/supabase/proxy";
import { proxy } from "@/proxy";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(actualizarSesion).mockResolvedValue(NextResponse.next());
});

describe("rutas operativas de usuarios", () => {
  it.each([
    "/usuarios/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "/auditoria/usuarios/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "/usuarios/perfil",
  ])("renueva la sesión sin retirar la ruta %s", async (ruta) => {
    const respuesta = await proxy(new NextRequest(`http://localhost:3000${ruta}`));
    expect(respuesta.headers.get("location")).toBeNull();
    expect(actualizarSesion).toHaveBeenCalledOnce();
  });

  it.each(["/usuarios/nuevo", "/usuarios/permisos"])("conserva la retirada de %s", async (ruta) => {
    const respuesta = await proxy(new NextRequest(`http://localhost:3000${ruta}`));
    expect(respuesta.headers.get("location")).toBe("http://localhost:3000/usuarios");
    expect(actualizarSesion).not.toHaveBeenCalled();
  });
});
