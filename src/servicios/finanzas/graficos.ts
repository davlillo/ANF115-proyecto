import { Decimal } from "@/lib/decimal";
import type { GraficoFinanciero, PeriodoFinanciero } from "@/types/finanzas";

const SERIES = [
  { clave: "ingresos", titulo: "Ingresos", unidad: "USD" },
  { clave: "gastos", titulo: "Gastos", unidad: "USD" },
  { clave: "resultado", titulo: "Resultado", unidad: "USD" },
  { clave: "porcentaje_gastos", titulo: "Porcentaje de gastos", unidad: "%" },
] as const;

/** Scales RPC results for SVG; no financial formula is recalculated here. */
export function prepararGraficos(periodos: PeriodoFinanciero[]): GraficoFinanciero[] {
  return SERIES.map(({ clave, titulo, unidad }) => {
    const valores = periodos.map((p) => p[clave]).filter((v): v is string => v !== null);
    const minimo = Decimal.min(0, ...valores);
    let maximo = Decimal.max(0, ...valores);
    if (maximo.eq(minimo)) maximo = minimo.plus(1);
    const rango = maximo.minus(minimo);
    const posicion = (valor: string) => new Decimal(164).minus(new Decimal(valor).minus(minimo).div(rango).times(148));
    const cero = posicion("0");
    const paso = new Decimal(392).div(Math.max(1, periodos.length));
    return {
      clave, titulo, unidad,
      minimo: minimo.toFixed(2), maximo: maximo.toFixed(2), cero: cero.toFixed(3),
      anchoBarra: Decimal.min(42, paso.times("0.65")).toFixed(3),
      conDatos: periodos.some((p) => p.cantidad > 0 && p[clave] !== null),
      puntos: periodos.map((p, indice) => {
        const valor = p[clave];
        const y = valor === null ? null : posicion(valor);
        return {
          periodo: p.periodo, valor,
          x: new Decimal(24).plus(paso.times(new Decimal(indice).plus("0.5"))).toFixed(3),
          y: y === null ? null : Decimal.min(y, cero).toFixed(3),
          alto: y === null ? "0" : y.minus(cero).abs().toFixed(3),
          negativo: valor !== null && new Decimal(valor).lt(0),
        };
      }),
    };
  });
}
