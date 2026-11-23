"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Route } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import type { GuiaFlujo } from "@/types/guias";

export function WorkflowGuide({ guia }: { guia: GuiaFlujo }) {
  const [actual, setActual] = useState(0);
  const details = useRef<HTMLDetailsElement>(null);
  const panelId = useId();
  const paso = guia.pasos[actual];

  function cerrarGuia() {
    if (details.current) details.current.open = false;
    if (paso.href?.startsWith("#")) {
      const destino = document.getElementById(paso.href.slice(1));
      destino?.scrollIntoView({ block: "center" });
      const control = destino?.matches("button, summary, input, select") ? destino
        : destino?.querySelector<HTMLElement>("input:not([type=hidden]), select, button, summary");
      if (control instanceof HTMLElement) control.focus({ preventScroll: true });
    }
  }

  return <details ref={details} data-workflow-guide className="group rounded-card border border-borde bg-superficie">
    <summary className="sin-marcador flex min-h-14 cursor-pointer items-center gap-3 rounded-card px-5 py-3 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-acento-tinte text-acento"><Route aria-hidden="true" className="size-4" /></span>
      <span className="min-w-0 flex-1 font-medium">Guía paso a paso<span className="ml-2 hidden font-normal text-texto-suave sm:inline">· {guia.titulo}</span></span>
      <span className="shrink-0 text-xs text-texto-suave">3 pasos</span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-texto-suave transition-transform group-open:rotate-180 motion-reduce:transition-none" />
    </summary>
    <div className="border-t border-borde p-5 sm:p-6">
      <p className="mb-4 text-xs text-texto-suave">Puedes seguir estos pasos o continuar trabajando sin la guía.</p>
      <ol aria-label="Pasos de la guía" className="mb-6 grid gap-2 sm:grid-cols-3">
        {guia.pasos.map((item, indice) => <li key={item.titulo}>
          <button type="button" aria-current={actual === indice ? "step" : undefined} aria-controls={panelId}
            onClick={() => setActual(indice)} className={cn("flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-input border px-3 py-3 text-left text-sm transition-colors", actual === indice ? "border-acento bg-acento-tinte text-texto" : "border-borde text-texto-suave hover:bg-superficie-fila")}>
            <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs", actual === indice ? "bg-acento text-white" : "bg-superficie-tenue text-texto-2")}>{indice + 1}</span>
            <span>{item.titulo}</span>
          </button>
        </li>)}
      </ol>
      <div id={panelId} aria-live="polite" aria-atomic="true" className="max-w-3xl space-y-2">
        <p className="font-mono text-xs text-acento">Paso {actual + 1} de 3</p>
        <h2 className="text-lg font-semibold">{paso.titulo}</h2>
        <p className="text-sm leading-relaxed text-texto-2">{paso.descripcion}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-4">
        {paso.href && paso.accion ? <Link href={paso.href} onClick={cerrarGuia} className={buttonVariants({ variant: "secondary" })}>{paso.accion}<ArrowRight aria-hidden="true" /></Link> : <span />}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" disabled={actual === 0} onClick={() => setActual((v) => v - 1)}><ArrowLeft aria-hidden="true" />Anterior</Button>
          {actual < 2 ? <Button onClick={() => setActual((v) => v + 1)}>Siguiente<ArrowRight aria-hidden="true" /></Button>
            : <Button onClick={() => { if (details.current) { details.current.open = false; details.current.querySelector("summary")?.focus(); } }}>Entendido</Button>}
        </div>
      </div>
    </div>
  </details>;
}
