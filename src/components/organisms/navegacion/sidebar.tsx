"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Croissant, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  filtrarNavegacion,
  navegacion,
  type GrupoNavegacion,
  type ItemNavegacion,
} from "@/config/navegacion";
import { Avatar } from "@/components/atoms/avatar";
import type { Permiso } from "@/config/permisos";
import { cn } from "@/lib/utils";
import { rutas } from "@/config/rutas";

type SidebarProps = {
  permisos?: readonly Permiso[];
  grupos?: readonly GrupoNavegacion[];
  cerrarSesion?: () => Promise<void>;
  perfil?: { nombre: string; rol: string };
};

function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ItemEnlace({
  item,
  pathname,
  alNavegar,
}: {
  item: ItemNavegacion;
  pathname: string;
  alNavegar?: () => void;
}) {
  const activo = esRutaActiva(pathname, item.href);
  const Icono = item.icono;

  return (
    <Link
      href={item.href}
      onClick={alNavegar}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-input border px-3 text-sm transition-colors",
        activo
          ? "border-borde bg-superficie font-semibold text-texto"
          : "border-transparent font-medium text-texto-2 hover:bg-superficie-tenue",
      )}
    >
      <Icono
        aria-hidden="true"
        className={cn("size-[18px] shrink-0", activo ? "text-texto" : "text-texto-suave")}
      />
      <span className="truncate">{item.titulo}</span>
    </Link>
  );
}

function ContenidoSidebar({
  pathname,
  grupos,
  alNavegar,
  cerrarSesion,
  perfil,
}: {
  pathname: string;
  grupos: readonly GrupoNavegacion[];
  alNavegar?: () => void;
  cerrarSesion?: () => Promise<void>;
  perfil?: { nombre: string; rol: string };
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Link
          href="/dashboard"
          onClick={alNavegar}
          className="flex w-fit items-center gap-3 rounded-input"
          aria-label="Panadería Carlitos Finanzas, ir al panel financiero"
        >
          <span className="flex size-[34px] items-center justify-center rounded-input bg-primario text-acento-tinte">
            <Croissant aria-hidden="true" className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-[-0.02em]">Carlitos</span>
            <span className="etiqueta-mono mt-0.5 tracking-[0.14em]">Finanzas</span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Navegación principal"
        className="scrollbar-menu flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        {grupos.map((grupo) => (
          <div key={grupo.id} className="space-y-1">
            <p className="etiqueta-mono px-3 pb-1">{grupo.titulo}</p>
            {grupo.items.map((item) => (
              <ItemEnlace
                key={item.href}
                item={item}
                pathname={pathname}
                alNavegar={alNavegar}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-1 rounded-[14px] border border-borde bg-superficie p-2">
          <Link
            href={rutas.usuarios.propio}
            onClick={alNavegar}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-input p-1 transition-colors hover:bg-superficie-fila"
            aria-label="Consultar mi perfil"
          >
            <Avatar nombre={perfil?.nombre ?? "Mi perfil"} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{perfil?.nombre ?? "Mi perfil"}</span>
              <span className="block text-xs capitalize text-texto-suave">{perfil?.rol}</span>
            </span>
          </Link>
          {cerrarSesion && (
            <form action={cerrarSesion}>
              <button
                className="flex size-9 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-superficie-tenue hover:text-texto"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Navegacion lateral del AppShell.
 *
 * En escritorio permanece fija; en pantallas pequenas se abre como dialogo.
 * La visibilidad del menu no sustituye la autorizacion del servidor.
 */
export function Sidebar({ permisos, grupos, cerrarSesion, perfil }: SidebarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  const gruposVisibles = permisos
    ? filtrarNavegacion(permisos)
    : (grupos ?? navegacion);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    botonCerrar.current?.focus();
    const devolverFoco = botonAbrir.current;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAbierto(false);
      }
      if (evento.key === "Tab") {
        const controles = dialogo.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])');
        const primero = controles?.[0];
        const ultimo = controles?.[controles.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault(); ultimo?.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault(); primero?.focus();
        }
      }
    };

    document.addEventListener("keydown", alPresionar);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = "";
      devolverFoco?.focus();
    };
  }, [abierto]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-borde bg-fondo/95 px-4 backdrop-blur lg:hidden">
        <button
          ref={botonAbrir}
          type="button"
          onClick={() => setAbierto(true)}
          className="flex size-10 items-center justify-center rounded-full text-texto transition-colors hover:bg-superficie-tenue"
          aria-label="Abrir menu de navegacion"
          aria-expanded={abierto}
          aria-controls="menu-lateral-movil"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center rounded-input bg-primario text-acento-tinte">
            <Croissant aria-hidden="true" className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-[-0.02em]">Carlitos</span>
        </Link>
      </header>

      <aside className="hidden w-[var(--ancho-sidebar)] shrink-0 border-r border-borde bg-fondo lg:block">
        <div className="fixed inset-y-0 left-0 w-[var(--ancho-sidebar)]">
          <ContenidoSidebar pathname={pathname} grupos={gruposVisibles} cerrarSesion={cerrarSesion} perfil={perfil} />
        </div>
      </aside>

      {abierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-texto/40 backdrop-blur-[2px]"
            aria-label="Cerrar menu de navegacion"
            onClick={() => setAbierto(false)}
          />
          <div
            ref={dialogo}
            id="menu-lateral-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacion"
            className="relative h-full w-[min(86vw,320px)] border-r border-borde bg-fondo shadow-flotante"
          >
            <button
              ref={botonCerrar}
              type="button"
              onClick={() => setAbierto(false)}
              className="absolute right-3 top-4 z-10 flex size-9 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-superficie-tenue hover:text-texto"
              aria-label="Cerrar menu"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <ContenidoSidebar
              pathname={pathname}
              grupos={gruposVisibles}
              alNavegar={() => setAbierto(false)}
              cerrarSesion={cerrarSesion}
              perfil={perfil}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
