import { describe, expect, it } from "vitest";
import { crearOpcionesGrafico, formatearValorGrafico, type ChartTheme } from "@/lib/echarts-options";
import { prepararGraficos } from "@/servicios/finanzas/graficos";
import type { PeriodoFinanciero } from "@/types/finanzas";

const tema: ChartTheme = { text: "black", muted: "gray", border: "gray", surface: "white", color: "green", danger: "red", font: "sans-serif" };
const periodo: PeriodoFinanciero = { periodo: "2026-11-12", ingresos: "9999999999999999.99", gastos: "0.01", resultado: "9999999999999999.98", porcentaje_gastos: "0.00", cantidad: 2 };

describe("Apache ECharts: presentación sin perder precisión", () => {
  it("solo entrega coordenadas acotadas al motor, no importes numéricos", () => {
    const opciones = crearOpcionesGrafico(prepararGraficos([periodo])[0], "line", tema);
    expect(opciones.series).toMatchObject([{ type: "line", data: [{ value: 100 }] }]);
    expect(opciones.animation).toBe(false);
    expect(opciones.aria).toMatchObject({ enabled: true });
  });

  it("conserva el importe original completo en el tooltip, sin HTML", () => {
    const opciones = crearOpcionesGrafico(prepararGraficos([periodo])[0], "bar", tema);
    const tooltip = opciones.tooltip;
    if (!tooltip || Array.isArray(tooltip) || typeof tooltip.formatter !== "function") throw new Error("Expected a formatter");
    expect(tooltip.renderMode).toBe("richText");
    const texto = tooltip.formatter({ componentType: "series", componentSubType: "bar", componentIndex: 0,
      name: periodo.periodo, dataIndex: 0, data: 100, value: 100, $vars: ["seriesName", "name", "value"] }, "test", () => undefined);
    expect(texto).toBe("2026-11-12\nIngresos: $9,999,999,999,999,999.99");
  });

  it("no transforma un porcentaje nulo en cero y usa rojo para valores negativos", () => {
    const datos = [{ ...periodo, ingresos: "0.00", resultado: "-0.01", porcentaje_gastos: null }];
    expect(crearOpcionesGrafico(prepararGraficos(datos)[3], "line", tema).series).toMatchObject([{ data: [{ value: null }] }]);
    expect(crearOpcionesGrafico(prepararGraficos(datos)[2], "bar", tema).series).toMatchObject([{ data: [{ value: -100, itemStyle: { color: "red" } }] }]);
  });

  it("solo añade el control de intervalo cuando hay muchos períodos", () => {
    const corto = crearOpcionesGrafico(prepararGraficos([periodo])[0], "bar", tema);
    const largo = crearOpcionesGrafico(prepararGraficos(Array.from({ length: 20 }, (_, i) => ({ ...periodo, periodo: `2026-11-${String(i + 1).padStart(2, "0")}` })))[0], "bar", tema);
    expect(corto.dataZoom).toEqual([]);
    expect(largo.dataZoom).toMatchObject([{ type: "slider", start: 0, end: 100, filterMode: "none" }]);
  });

  it("mantiene los rótulos exactos de moneda y porcentaje", () => {
    expect(formatearValorGrafico("-0.01", "USD")).toBe("-$0.01");
    expect(formatearValorGrafico("125.50", "%")).toBe("125.50 %");
    expect(formatearValorGrafico(null, "%")).toBe("No aplica");
  });
});
