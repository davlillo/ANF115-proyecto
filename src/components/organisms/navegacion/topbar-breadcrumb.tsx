"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { navegacion } from "@/config/navegacion";
import { rutas } from "@/config/rutas";

const ITEMS = navegacion.flatMap((grupo) => grupo.items);

function tituloDeRuta(pathname: string): string | null {
  if (pathname === rutas.usuarios.propio) {
    return "Mi perfil";
  }
  const coincidencias = ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length);
  return coincidencias[0]?.titulo ?? null;
}

/** Migas de pan del encabezado: empresa y pagina actual segun la ruta. */
export function TopbarBreadcrumb({ empresa }: { empresa: string }) {
  const titulo = tituloDeRuta(usePathname());

  return (
    <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-2 text-[13px]">
      <span className="truncate text-texto-suave">{empresa}</span>
      {titulo ? (
        <>
          <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-texto-suave" />
          <span aria-current="page" className="truncate font-medium text-texto">{titulo}</span>
        </>
      ) : null}
    </nav>
  );
}
