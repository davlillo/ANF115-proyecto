import "server-only";
import { crearClienteFinanzas } from "@/supabase/finanzas.server";
import { ErrorDominio } from "@/lib/errores";
import { aImporteCanonico } from "@/lib/decimal";
import type { FiltroFinanciero, Movimiento } from "@/types/finanzas";
import { comprobarError } from "./finanzas.repository";

const LOTE = 1000;
const MAXIMO_FILAS = 20000;

/**
 * Lee todos los movimientos del filtro (no solo una pagina) para exportarlos.
 * El resultado respeta RLS: un empleado exporta unicamente sus movimientos.
 */
export async function leerMovimientosParaExportar(f: FiltroFinanciero): Promise<Movimiento[]> {
  const c = await crearClienteFinanzas();
  const filas: Movimiento[] = [];
  for (let inicio = 0; inicio < MAXIMO_FILAS; inicio += LOTE) {
    let q = c.from("v_movimientos").select("*").gte("fecha", f.desde).lte("fecha", f.hasta);
    if (f.tipo) q = q.eq("tipo", f.tipo);
    if (f.categoria) q = q.eq("categoria_id", f.categoria);
    const { data, error } = await q
      .order("fecha", { ascending: true }).order("id", { ascending: true })
      .range(inicio, inicio + LOTE - 1);
    comprobarError(error);
    const lote = data ?? [];
    filas.push(...lote.map((m) => ({ ...m, monto: aImporteCanonico(m.monto) })));
    if (lote.length < LOTE) return filas;
  }
  throw new ErrorDominio("LIMITE_EXCEDIDO", "El reporte supera 20,000 movimientos. Reduzca el rango de fechas.");
}