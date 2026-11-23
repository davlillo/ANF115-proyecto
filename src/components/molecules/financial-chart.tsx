"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChartColumn, ChartLine, RefreshCw } from "lucide-react";
import type { EChartsType } from "echarts/core";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { crearOpcionesGrafico, formatearValorGrafico, type ChartView } from "@/lib/echarts-options";
import type { GraficoFinanciero } from "@/types/finanzas";

export function FinancialChart({ grafico, agrupacion }: { grafico: GraficoFinanciero; agrupacion: string }) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<EChartsType | null>(null);
  const cursor = useRef(0);
  const [vista, setVista] = useState<ChartView>(grafico.clave === "gastos" ? "bar" : "line");
  const [estado, setEstado] = useState<"loading" | "ready" | "error">("loading");
  const [intento, setIntento] = useState(0);
  const [seleccion, setSeleccion] = useState("");
  const ayudaId = useId();

  useEffect(() => {
    const elemento = host.current;
    if (!elemento) return;
    let cancelado = false;
    let observer: ResizeObserver | undefined;
    let chart: EChartsType | undefined;
    import("@/lib/echarts").then(({ init }) => {
      if (cancelado) return;
      const styles = getComputedStyle(elemento);
      const token = (nombre: string) => styles.getPropertyValue(nombre).trim();
      const color = grafico.clave === "ingresos" ? "--exito" : grafico.clave === "gastos" ? "--acento"
        : grafico.clave === "resultado" ? "--primario" : "--info";
      chart = init(elemento, undefined, { renderer: "svg" });
      chart.setOption(crearOpcionesGrafico(grafico, vista, {
        text: token("--texto-principal"), muted: token("--texto-suave"), border: token("--borde"),
        surface: token("--superficie"), color: token(color), danger: token("--peligro"), font: styles.fontFamily,
      }));
      // The keyboard-enabled host is the accessible image, not its internal SVG.
      elemento.querySelector("svg")?.setAttribute("aria-hidden", "true");
      elemento.querySelector("svg")?.setAttribute("focusable", "false");
      instance.current = chart;
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(elemento);
      setEstado("ready");
    }).catch(() => { if (!cancelado) setEstado("error"); });
    return () => { cancelado = true; observer?.disconnect(); chart?.dispose(); instance.current = null; };
  }, [grafico, vista, intento]);

  return <div>
    <div role="group" aria-label={`Vista de ${grafico.titulo}`} className="mt-5 flex w-fit rounded-pill bg-superficie-tenue p-1">
      {([ ["line", "Líneas", ChartLine], ["bar", "Barras", ChartColumn] ] as const).map(([tipo, nombre, Icono]) =>
        <button key={tipo} type="button" aria-pressed={vista === tipo} onClick={() => setVista(tipo)}
          className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-pill px-3 text-xs transition-colors", vista === tipo ? "bg-superficie font-semibold text-texto shadow-sm" : "text-texto-suave hover:text-texto")}>
          <Icono aria-hidden="true" className="size-3.5" />{nombre}
        </button>)}
    </div>
    <div className="relative mt-2 h-64 min-w-0" data-chart-engine="apache-echarts" data-chart-state={estado}>
      <div ref={host} role="img" tabIndex={estado === "ready" ? 0 : -1}
        aria-label={`${grafico.titulo} por ${agrupacion}`} aria-describedby={ayudaId}
        className="h-full w-full rounded-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !instance.current) return;
          event.preventDefault();
          const ultimo = grafico.puntos.length - 1;
          cursor.current = event.key === "Home" ? 0 : event.key === "End" ? ultimo
            : Math.max(0, Math.min(ultimo, cursor.current + (event.key === "ArrowRight" ? 1 : -1)));
          const dato = grafico.puntos[cursor.current];
          instance.current.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: cursor.current });
          setSeleccion(`${dato.periodo}: ${formatearValorGrafico(dato.valor, grafico.unidad)}`);
        }} />
      {estado === "loading" && <div role="status" className="absolute inset-0 flex items-center justify-center rounded-input bg-superficie-fila text-sm text-texto-suave">Cargando gráfico…</div>}
      {estado === "error" && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-input bg-superficie-fila px-5 text-center text-sm">
        <p>No se pudo mostrar el gráfico. Los valores siguen disponibles en la tabla.</p>
        <Button variant="secondary" onClick={() => { setEstado("loading"); setIntento((v) => v + 1); }}><RefreshCw aria-hidden="true" />Reintentar</Button>
      </div>}
    </div>
    <p id={ayudaId} className="mt-3 text-xs leading-relaxed text-texto-suave">Explora con el puntero o toca un punto. Con el gráfico enfocado, usa las flechas ← →. {grafico.puntos.length > 14 && "Amplía un intervalo con el control inferior."}</p>
    <p aria-live="polite" className="sr-only">{seleccion}</p>
  </div>;
}
