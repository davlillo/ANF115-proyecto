import type {
  DistribucionCategoria,
  FiltroFinanciero,
  Movimiento,
  PeriodoFinanciero,
  ResumenFinanciero,
} from "@/types/finanzas";

/** Datos ya calculados y autorizados que reciben los exportadores PDF y Excel. */
export type DatosReporte = {
  generadoEn: string;
  generadoPor: string;
  filtro: FiltroFinanciero;
  categoriaNombre: string | null;
  resumen: ResumenFinanciero;
  periodos: PeriodoFinanciero[];
  distribucion: DistribucionCategoria[];
  movimientos: Movimiento[];
};

export const ETIQUETA_GRANULARIDAD: Readonly<Record<FiltroFinanciero["granularidad"], string>> = {
  dia: "Diario",
  mes: "Mensual",
  anio: "Anual",
};