import { connection, NextResponse, type NextRequest } from "next/server";
import { generarArchivoReporte } from "@/controladores/reportes.controller";
import { ESTADO_HTTP, type CodigoError } from "@/lib/errores";

/**
 * Descarga del reporte: GET /api/reportes/pdf?desde=...&hasta=... o /api/reportes/xlsx?...
 * Esta ruta vive bajo /api porque el proxy redirige cualquier /reportes/* a la lista.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ formato: string }> }) {
  await connection();
  const { formato } = await params;
  const r = await generarArchivoReporte(formato, Object.fromEntries(request.nextUrl.searchParams));
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: { codigo: r.error.codigo, mensaje: r.error.mensaje } },
      { status: ESTADO_HTTP[r.error.codigo as CodigoError] ?? 500, headers: { "Cache-Control": "no-store" } });
  }
  return new NextResponse(new Uint8Array(r.datos.contenido), {
    headers: {
      "Content-Type": r.datos.tipoMime,
      "Content-Disposition": `attachment; filename="${r.datos.nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}