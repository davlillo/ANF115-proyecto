import { formatearUSD } from "@/lib/dinero";
import { cn } from "@/lib/utils";
import type { GraficoFinanciero } from "@/types/finanzas";

function valorVisible(valor: string | null, unidad: "USD" | "%"): string {
  return valor === null ? "No aplica" : unidad === "USD" ? formatearUSD(valor) : `${valor} %`;
}

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
        <div className="mt-6 flex gap-3">
          <div aria-hidden="true" className="flex max-w-28 shrink-0 flex-col justify-between py-3 text-right font-mono text-[11px] tabular-nums text-texto-suave">
            <span>{valorVisible(grafico.maximo, grafico.unidad)}</span>
            <span>{valorVisible(grafico.minimo, grafico.unidad)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <svg role="img" aria-label={`${grafico.titulo} por ${agrupacion}; valores exactos en la tabla del gráfico.`}
              viewBox="0 0 440 180" className="w-full">
              {[16, 53, 90, 127, 164].map((y) => <line key={y} x1="0" x2="440" y1={y} y2={y} className="stroke-borde" strokeDasharray="3 5" />)}
              <line x1="0" x2="440" y1={grafico.cero} y2={grafico.cero} className="stroke-borde-fuerte" />
              {grafico.puntos.filter((p) => p.y !== null).map((p) => <g key={p.periodo} transform={`translate(${p.x},0)`}>
                <rect x="0" y={p.y!} width={grafico.anchoBarra} height={p.alto} rx="3"
                  transform={`translate(-${Number(grafico.anchoBarra) / 2},0)`}
                  className={cn(p.negativo ? "fill-peligro" : grafico.clave === "ingresos" ? "fill-exito" : grafico.clave === "gastos" ? "fill-acento" : grafico.clave === "resultado" ? "fill-primario" : "fill-info")}>
                  <title>{`${p.periodo}: ${valorVisible(p.valor, grafico.unidad)}`}</title>
                </rect>
              </g>)}
            </svg>
            <div aria-hidden="true" className="flex justify-between gap-2 font-mono text-[11px] text-texto-suave">
              <span>{grafico.puntos[0]?.periodo}</span>{grafico.puntos.length > 1 && <span>{grafico.puntos.at(-1)?.periodo}</span>}
            </div>
          </div>
        </div>
        <details className="mt-5 border-t border-borde pt-4">
          <summary className="w-fit cursor-pointer text-xs font-medium text-texto-2">Ver datos del gráfico</summary>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{grafico.titulo} por {agrupacion}</caption>
              <thead><tr><th scope="col" className="py-2 text-left font-medium">Período</th><th scope="col" className="py-2 text-right font-medium">{grafico.unidad}</th></tr></thead>
              <tbody>{grafico.puntos.map((p) => <tr key={p.periodo} className="border-t border-borde">
                <th scope="row" className="py-2 text-left font-mono text-xs font-normal">{p.periodo}</th>
                <td className="py-2 text-right font-mono tabular-nums">{valorVisible(p.valor, grafico.unidad)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </details>
      </>}
    </article>)}
  </section>;
}
