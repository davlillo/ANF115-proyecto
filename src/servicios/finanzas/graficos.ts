import { Decimal } from "@/lib/decimal";
import type { GraficoFinanciero, PeriodoFinanciero } from "@/types/finanzas";

const SERIES = [
  { clave: "ingresos", titulo: "Ingresos", unidad: "USD" },
  { clave: "gastos", titulo: "Gastos", unidad: "USD" },
  { clave: "resultado", titulo: "Resultado", unidad: "USD" },
  { clave: "porcentaje_gastos", titulo: "Porcentaje de gastos", unidad: "%" },
] as const;

/** Only bounded drawing coordinates are numeric in ECharts; money stays exact text. */
export function prepararGraficos(periodos: PeriodoFinanciero[]): GraficoFinanciero[] {
  return SERIES.map(({ clave, titulo, unidad }) => {
    const valores = periodos.map((p) => p[clave]).filter((v): v is string => v !== null);
    const minimo = Decimal.min(0, ...valores);
    let maximo = Decimal.max(0, ...valores);
    if (maximo.eq(minimo)) maximo = minimo.plus(1);
    const escala = Decimal.max(minimo.abs(), maximo.abs());
    const limiteInferior = minimo.lt(0) ? "-100" : "0";
    const limiteSuperior = maximo.gt(0) ? "100" : "0";
    const paso = new Decimal(limiteSuperior).minus(limiteInferior).div(4);
    return {
      clave, titulo, unidad,
      minimo: minimo.toFixed(2), maximo: maximo.toFixed(2), limiteInferior, limiteSuperior,
      marcas: Array.from({ length: 5 }, (_, indice) => {
        const posicion = new Decimal(limiteInferior).plus(paso.times(indice));
        return { posicion: posicion.toFixed(2), valor: escala.times(posicion).div(100).toFixed(2) };
      }),
      conDatos: periodos.some((p) => p.cantidad > 0 && p[clave] !== null),
      puntos: periodos.map((p) => {
        const valor = p[clave];
        return {
          periodo: p.periodo, valor,
          posicion: valor === null ? null : new Decimal(valor).div(escala).times(100).toFixed(8),
          negativo: valor !== null && new Decimal(valor).lt(0),
        };
      }),
    };
  });
}
