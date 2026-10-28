import "server-only";
import { z } from "zod";
import { requerirPerfilOperativo } from "@/auth/perfil-operativo";
import { leerCategorias, leerReporte } from "@/repositorios/finanzas.repository";
import { leerMovimientosParaExportar } from "@/repositorios/reportes.repository";
import { filtroFinancieroSchema } from "@/schemas/finanzas.schema";
import { anchoComparativo } from "@/servicios/finanzas/resumen";
import { exportarPdf } from "@/servicios/reportes/exportar-pdf";
import { exportarXlsx } from "@/servicios/reportes/exportar-xlsx";
import type { DatosReporte } from "@/servicios/reportes/tipos";
import { desdeError, fallo, generarRequestId, ok } from "@/lib/resultado";
import { hoyEnElSalvador } from "@/lib/fechas";
import type { Resultado } from "@/types/respuestas";

type Query = Record<string, string | string[] | undefined>;
function texto(q: Query, k: string) { return typeof q[k] === "string" ? q[k] : undefined; }

export type FormatoReporte = "pdf" | "xlsx";
export type ArchivoReporte = { nombre: string; tipoMime: string; contenido: Uint8Array };

const TIPO_MIME: Record<FormatoReporte, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** Genera el PDF o Excel del reporte con el mismo filtro y los mismos totales de la pantalla. */
export async function generarArchivoReporte(formato: string, q: Query): Promise<Resultado<ArchivoReporte>> {
  const requestId = generarRequestId();
  try {
    if (formato !== "pdf" && formato !== "xlsx") return fallo("RECURSO_NO_ENCONTRADO", requestId);
    const { perfil } = await requerirPerfilOperativo();
    const hoy = hoyEnElSalvador();
    const filtro = filtroFinancieroSchema.parse({
      desde: texto(q, "desde") ?? `${hoy.slice(0, 7)}-01`,
      hasta: texto(q, "hasta") ?? hoy,
      categoria: texto(q, "categoria") || undefined,
      tipo: texto(q, "tipo") || undefined,
      granularidad: texto(q, "granularidad") ?? "mes",
    });
    const [categorias, reporte, movimientos] = await Promise.all([
      leerCategorias(), leerReporte(filtro), leerMovimientosParaExportar(filtro),
    ]);
    const datos: DatosReporte = {
      generadoEn: new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", dateStyle: "short", timeStyle: "short" }).format(new Date()),
      generadoPor: `${perfil.nombre} (${perfil.rol})`,
      filtro,
      categoriaNombre: categorias.find((c) => c.id === filtro.categoria)?.nombre ?? null,
      resumen: reporte.resumen,
      periodos: reporte.periodos,
      distribucion: reporte.categorias.map((c) => ({ ...c, ancho: anchoComparativo(c.monto, reporte.resumen.gastos) })),
      movimientos,
    };
    const contenido = formato === "pdf" ? exportarPdf(datos) : await exportarXlsx(datos);
    return ok({ nombre: `reporte-carlitos_${filtro.desde}_${filtro.hasta}.${formato}`, tipoMime: TIPO_MIME[formato], contenido }, requestId);
  } catch (e) {
    if (e instanceof z.ZodError) return fallo("VALIDACION_ENTRADA", requestId, { mensaje: "Revise fechas, categoría y agrupación. El rango máximo es de 3660 días." });
    return desdeError(e, requestId);
  }
}