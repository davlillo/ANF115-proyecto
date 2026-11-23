import type { EChartsOption } from "echarts";
import { formatearUSD } from "@/lib/dinero";
import type { GraficoFinanciero } from "@/types/finanzas";

export type ChartTheme = { text: string; muted: string; border: string; surface: string; color: string; danger: string; font: string };
export type ChartView = "line" | "bar";

export function formatearValorGrafico(valor: string | null, unidad: "USD" | "%"): string {
  return valor === null ? "No aplica" : unidad === "USD" ? formatearUSD(valor) : `${valor} %`;
}

export function crearOpcionesGrafico(grafico: GraficoFinanciero, vista: ChartView, tema: ChartTheme): EChartsOption {
  const zoom = grafico.puntos.length > 14;
  const marcas = new Map(grafico.marcas.map((m) => [m.posicion, formatearValorGrafico(m.valor, grafico.unidad)]));
  const datos = grafico.puntos.map((p) => ({
    // This Number is a bounded drawing coordinate, never a monetary amount.
    value: p.posicion === null ? null : Number(p.posicion),
    itemStyle: { color: p.negativo ? tema.danger : tema.color },
  }));
  return {
    animation: false,
    textStyle: { fontFamily: tema.font, color: tema.text },
    aria: { enabled: true, label: { description: `${grafico.titulo}. Consulta los importes exactos en la tabla del gráfico.` } },
    grid: { left: 12, right: 16, top: 20, bottom: zoom ? 64 : 16, containLabel: true },
    tooltip: {
      trigger: "axis", renderMode: "richText", confine: true,
      backgroundColor: tema.surface, borderColor: tema.border, textStyle: { color: tema.text, fontSize: 13 },
      formatter: (parametros) => {
        const punto = Array.isArray(parametros) ? parametros[0] : parametros;
        const dato = grafico.puntos[punto?.dataIndex];
        return dato ? `${dato.periodo}\n${grafico.titulo}: ${formatearValorGrafico(dato.valor, grafico.unidad)}` : "";
      },
      axisPointer: { type: vista === "bar" ? "shadow" : "line", label: { show: false } },
    },
    xAxis: {
      type: "category", data: grafico.puntos.map((p) => p.periodo), boundaryGap: vista === "bar",
      axisLine: { lineStyle: { color: tema.border } }, axisTick: { show: false },
      axisLabel: { color: tema.muted, fontSize: 11, hideOverlap: true, formatter: (periodo: string) => periodo.slice(5) || periodo },
    },
    yAxis: {
      type: "value", min: Number(grafico.limiteInferior), max: Number(grafico.limiteSuperior), splitNumber: 4,
      interval: (Number(grafico.limiteSuperior) - Number(grafico.limiteInferior)) / 4,
      axisLabel: { color: tema.muted, fontSize: 11, width: 106, overflow: "truncate", formatter: (posicion: number) => marcas.get(posicion.toFixed(2)) ?? "" },
      splitLine: { lineStyle: { color: tema.border, type: "dashed" } },
    },
    dataZoom: zoom ? [{ type: "slider", height: 20, bottom: 4, start: 0, end: 100,
      borderColor: tema.border, textStyle: { color: tema.muted }, handleStyle: { color: tema.color },
      showDetail: false, brushSelect: false, filterMode: "none" }] : [],
    series: [{
      name: grafico.titulo, type: vista, data: datos,
      ...(vista === "line" ? { smooth: false, symbol: "circle", symbolSize: 7, connectNulls: false,
        lineStyle: { color: tema.color, width: 3 }, areaStyle: { color: tema.color, opacity: 0.07 } }
        : { barMaxWidth: 32, itemStyle: { borderRadius: [4, 4, 0, 0] } }),
      emphasis: { focus: "series" },
    }],
  };
}
