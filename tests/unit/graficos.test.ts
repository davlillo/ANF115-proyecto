import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FinancialCharts } from "@/components/organisms/financial-charts";
import { prepararGraficos } from "@/servicios/finanzas/graficos";
import type { PeriodoFinanciero } from "@/types/finanzas";

const periodo: PeriodoFinanciero = {
  periodo: "2026-10", ingresos: "12000.00", gastos: "9600.00", resultado: "2400.00",
  porcentaje_gastos: "80.00", cantidad: 10,
};

describe("RF08: gráficos del panel", () => {
  it("incluye los valores exactos en el HTML sin depender del motor del navegador", () => {
    const html = renderToStaticMarkup(createElement(FinancialCharts, {
      graficos: prepararGraficos([periodo]), granularidad: "mes",
    }));
    expect(html).toContain("$12,000.00");
    expect(html).toContain("80.00 %");
    expect(html).toContain('data-chart-engine="apache-echarts"');
    expect(html).toContain('data-chart-state="loading"');
    expect(html).toContain('<caption class="sr-only">Ingresos por mes</caption>');
  });

  it("presenta las cuatro series sin recalcular los resultados recibidos", () => {
    const graficos = prepararGraficos([periodo]);
    expect(graficos.map((g) => g.clave)).toEqual(["ingresos", "gastos", "resultado", "porcentaje_gastos"]);
    expect(graficos.map((g) => g.puntos[0].valor)).toEqual(["12000.00", "9600.00", "2400.00", "80.00"]);
    expect(graficos.every((g) => g.conDatos)).toBe(true);
    expect(graficos[0].puntos[0].posicion).toBe("100.00000000");
  });

  it("representa pérdidas por debajo de cero y conserva el signo", () => {
    const grafico = prepararGraficos([periodo, { ...periodo, periodo: "2026-11", resultado: "-3600.00" }])[2];
    expect(grafico.minimo).toBe("-3600.00");
    expect(grafico.maximo).toBe("2400.00");
    expect(grafico.puntos[1].negativo).toBe(true);
    expect(grafico.puntos[1].posicion).toBe("-100.00000000");
    expect(grafico.limiteInferior).toBe("-100");
    expect(grafico.marcas.find((m) => m.posicion === "0.00")?.valor).toBe("0.00");
    expect(grafico.puntos[1].valor).toBe("-3600.00");
  });

  it("no convierte un porcentaje no calculable en cero", () => {
    const grafico = prepararGraficos([{ ...periodo, ingresos: "0.00", porcentaje_gastos: null }])[3];
    expect(grafico.conDatos).toBe(false);
    expect(grafico.puntos[0]).toMatchObject({ valor: null, posicion: null });
  });

  it("mantiene el vacío y no inventa series de ejemplo", () => {
    expect(prepararGraficos([]).every((g) => !g.conDatos && g.puntos.length === 0)).toBe(true);
    expect(prepararGraficos([{ ...periodo, cantidad: 0 }]).every((g) => !g.conDatos)).toBe(true);
  });

  it("conserva importes grandes y centavos como texto", () => {
    const grafico = prepararGraficos([{ ...periodo, ingresos: "9999999999999999.99" }])[0];
    expect(grafico.puntos[0].valor).toBe("9999999999999999.99");
    expect(grafico.maximo).toBe("9999999999999999.99");
    expect(grafico.marcas.at(-1)?.valor).toBe("9999999999999999.99");
    expect(grafico.puntos[0].posicion).toBe("100.00000000");
  });

  it("maneja cero y porcentajes mayores de 100 sin recortarlos", () => {
    const graficos = prepararGraficos([{ ...periodo, resultado: "0.00", porcentaje_gastos: "125.50" }]);
    expect(graficos[2].puntos[0].posicion).toBe("0.00000000");
    expect(graficos[3].maximo).toBe("125.50");
    expect(graficos.every((g) => !JSON.stringify(g).includes("NaN"))).toBe(true);
  });

  it("mantiene la escala acotada con importes pequeños, grandes y pérdidas", () => {
    for (const resultado of ["0.01", "-0.01", "-9999999999999999.99", "9999999999999999.99"]) {
      const grafico = prepararGraficos([{ ...periodo, resultado }])[2];
      expect(Math.abs(Number(grafico.puntos[0].posicion))).toBeLessThanOrEqual(100);
      expect(grafico.puntos[0].valor).toBe(resultado);
      expect(grafico.marcas).toHaveLength(5);
    }
  });
});
