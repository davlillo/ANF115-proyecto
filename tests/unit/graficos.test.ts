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
  it("incluye el texto SVG en el HTML inicial para hidratar sin diferencias", () => {
    const html = renderToStaticMarkup(createElement(FinancialCharts, {
      graficos: prepararGraficos([periodo]), granularidad: "mes",
    }));
    expect(html).toContain("<title>2026-10: $12,000.00</title>");
    expect(html).toContain("<title>2026-10: 80.00 %</title>");
    expect(html).not.toContain("<title></title>");
  });

  it("presenta las cuatro series sin recalcular los resultados recibidos", () => {
    const graficos = prepararGraficos([periodo]);
    expect(graficos.map((g) => g.clave)).toEqual(["ingresos", "gastos", "resultado", "porcentaje_gastos"]);
    expect(graficos.map((g) => g.puntos[0].valor)).toEqual(["12000.00", "9600.00", "2400.00", "80.00"]);
    expect(graficos.every((g) => g.conDatos)).toBe(true);
    expect(graficos[0].puntos[0].alto).toBe("148.000");
  });

  it("representa pérdidas por debajo de cero y conserva el signo", () => {
    const grafico = prepararGraficos([periodo, { ...periodo, periodo: "2026-11", resultado: "-3600.00" }])[2];
    expect(grafico.minimo).toBe("-3600.00");
    expect(grafico.maximo).toBe("2400.00");
    expect(grafico.puntos[1].negativo).toBe(true);
    expect(grafico.puntos[1].y).toBe(grafico.cero);
    expect(grafico.puntos[1].valor).toBe("-3600.00");
  });

  it("no convierte un porcentaje no calculable en cero", () => {
    const grafico = prepararGraficos([{ ...periodo, ingresos: "0.00", porcentaje_gastos: null }])[3];
    expect(grafico.conDatos).toBe(false);
    expect(grafico.puntos[0]).toMatchObject({ valor: null, y: null, alto: "0" });
  });

  it("mantiene el vacío y no inventa series de ejemplo", () => {
    expect(prepararGraficos([]).every((g) => !g.conDatos && g.puntos.length === 0)).toBe(true);
    expect(prepararGraficos([{ ...periodo, cantidad: 0 }]).every((g) => !g.conDatos)).toBe(true);
  });

  it("conserva importes grandes y centavos como texto", () => {
    const grafico = prepararGraficos([{ ...periodo, ingresos: "9999999999999999.99" }])[0];
    expect(grafico.puntos[0].valor).toBe("9999999999999999.99");
    expect(grafico.maximo).toBe("9999999999999999.99");
  });

  it("maneja cero y porcentajes mayores de 100 sin recortarlos", () => {
    const graficos = prepararGraficos([{ ...periodo, resultado: "0.00", porcentaje_gastos: "125.50" }]);
    expect(graficos[2].puntos[0].alto).toBe("0.000");
    expect(graficos[3].maximo).toBe("125.50");
    expect(graficos.every((g) => !JSON.stringify(g).includes("NaN"))).toBe(true);
  });
});
