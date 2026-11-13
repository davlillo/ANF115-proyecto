import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/supabase/proxy";
import { NextResponse } from "next/server";
import { rutas, rutasRetiradas } from "@/config/rutas";

/**
 * Punto de entrada de Proxy en Next.js 16 (antes middleware).
 *
 * No sustituye la autorizacion de los casos de uso: solo mantiene la sesion.
 */
export async function proxy(request: NextRequest) {
  if (rutasRetiradas.some((ruta) => request.nextUrl.pathname === ruta || request.nextUrl.pathname.startsWith(`${ruta}/`))) {
    return NextResponse.redirect(new URL(rutas.dashboard, request.url));
  }
  if ([rutas.usuarios.nuevo, rutas.usuarios.permisos].some((ruta) =>
    request.nextUrl.pathname === ruta || request.nextUrl.pathname.startsWith(`${ruta}/`))) {
    return NextResponse.redirect(new URL(rutas.usuarios.lista, request.url));
  }
  if (request.nextUrl.pathname.startsWith("/reportes/")) {
    return NextResponse.redirect(new URL(rutas.reportes.lista, request.url));
  }
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
