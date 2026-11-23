import { FinancialChart } from "@/components/molecules/financial-chart";
import { formatearValorGrafico } from "@/lib/echarts-options";
import type { GraficoFinanciero } from "@/types/finanzas";

export function FinancialCharts({ graficos, granularidad }: {
  graficos: GraficoFinanciero[];
  granularidad: "dia" | "mes" | "anio";
}) {
  const agrupacion = granularidad === "dia" ? "día" : granularidad === "mes" ? "mes" : "año";
  return <section aria-label="Gráficos financieros" className="grid gap-5 xl:grid-cols-2">
    {graficos.map((grafico) => <article key={grafico.clave} className="min-w-0 rounded-card border border-borde bg-superficie p-5 sm:p-6">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{grafico.titulo}</h2>
        <span className="text-xs text-texto-suave">{grafico.unidad} / {agrupacion}</span>
      </header>
      {!grafico.conDatos ? <p className="flex min-h-52 items-center justify-center text-center text-sm text-texto-suave">
        {grafico.clave === "porcentaje_gastos" ? "No aplica: no hay ingresos vigentes en este período." : "Sin movimientos vigentes en este período."}
      </p> : <>
        <FinancialChart grafico={grafico} agrupacion={agrupacion} />
        <details className="mt-5 border-t border-borde pt-4">
          <summary className="w-fit cursor-pointer text-xs font-medium text-texto-2">Ver datos del gráfico</summary>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{grafico.titulo} por {agrupacion}</caption>
              <thead><tr><th scope="col" className="py-2 text-left font-medium">Período</th><th scope="col" className="py-2 text-right font-medium">{grafico.unidad}</th></tr></thead>
              <tbody>{grafico.puntos.map((p) => <tr key={p.periodo} className="border-t border-borde">
                <th scope="row" className="py-2 text-left font-mono text-xs font-normal">{p.periodo}</th>
                <td className="py-2 text-right font-mono tabular-nums">{formatearValorGrafico(p.valor, grafico.unidad)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </details>
      </>}
    </article>)}
  </section>;
}
