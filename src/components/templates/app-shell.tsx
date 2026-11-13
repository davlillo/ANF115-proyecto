import { Suspense } from "react";
import type * as React from "react";
import { Sidebar } from "@/components/organisms/navegacion/sidebar";
import { TopbarBreadcrumb } from "@/components/organisms/navegacion/topbar-breadcrumb";
import type { GrupoNavegacion } from "@/config/navegacion";
import type { Permiso } from "@/config/permisos";
import type { ContextoAcceso } from "@/types/contexto";

/**
 * Fallback mientras el cliente resuelve la ruta activa.
 * Evita que usePathname bloquee el prerender del area privada.
 */
function SidebarFallback() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-borde bg-fondo lg:hidden" />
      <aside
        aria-hidden="true"
        className="hidden w-[var(--ancho-sidebar)] shrink-0 border-r border-borde bg-fondo lg:block"
      />
    </>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  contexto: ContextoAcceso;
  permisos?: readonly Permiso[];
  grupos?: readonly GrupoNavegacion[];
  cerrarSesion: () => Promise<void>;
};

/**
 * Estructura comun del area privada: navegacion lateral, barra superior con
 * migas y contenido. El perfil y el cierre de sesion viven en la barra lateral.
 */
export function AppShell({
  children,
  contexto,
  permisos,
  grupos,
  cerrarSesion,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-fondo lg:flex">
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido principal
      </a>

      <Suspense fallback={<SidebarFallback />}>
        <Sidebar permisos={permisos} grupos={grupos} cerrarSesion={cerrarSesion}
          perfil={{ nombre: contexto.usuarioNombre, rol: contexto.rolCodigo }} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 border-b border-borde bg-fondo/90 px-10 backdrop-blur lg:flex">
          <Suspense fallback={<span className="text-[13px] text-texto-suave">{contexto.empresaNombre}</span>}>
            <TopbarBreadcrumb empresa={contexto.empresaNombre} />
          </Suspense>
        </header>

        <main
          id="contenido-principal"
          className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8"
        >
          <div className="mx-auto flex w-full max-w-[var(--ancho-contenido)] flex-col gap-6">
            {children}
          </div>
        </main>
        <footer className="px-4 pb-5 text-xs text-texto-suave sm:px-6 lg:px-10">
          <p className="mx-auto max-w-[var(--ancho-contenido)]">{contexto.origenDatos === "simulado" ? "Datos simulados" : "Datos reales"} · {contexto.moneda}</p>
        </footer>
      </div>
    </div>
  );
}
