"use client";

import { ChevronDown, ChevronUp, Code } from "lucide-react";
import { Fragment, useId, useState } from "react";
import { Avatar } from "@/components/atoms/avatar";
import { Badge, type BadgeProps } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import type { ResumenCambio } from "@/lib/bitacora";

type AuditRowProps = {
  fechaHoraIso: string;
  fechaHora: string;
  accion: { etiqueta: string; tono: NonNullable<BadgeProps["variant"]> };
  entidad: string;
  actor: { nombre: string; detalle: string };
  resumen: ResumenCambio;
  motivo: string | null;
  datosTecnicos: string;
};

/** Fila de bitacora con el detalle del cambio expandible en linea. */
export function AuditRow({
  fechaHoraIso,
  fechaHora,
  accion,
  entidad,
  actor,
  resumen,
  motivo,
  datosTecnicos,
}: AuditRowProps) {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();

  return (
    <Fragment>
      <tr className={cn("border-b border-borde align-middle", abierto ? "bg-superficie-fila" : "hover:bg-superficie-fila")}>
        <td className="whitespace-nowrap px-6 py-[13px] font-mono text-xs tabular-nums"><time dateTime={fechaHoraIso}>{fechaHora}</time></td>
        <td className="px-6 py-[13px]"><Badge variant={accion.tono}>{accion.etiqueta}</Badge></td>
        <td className="px-6 py-[13px] text-sm">{entidad}</td>
        <td className="px-6 py-[13px]">
          <div className="flex items-center gap-3">
            <Avatar nombre={actor.nombre} className="size-8" />
            <div>
              <strong className="block text-sm font-medium">{actor.nombre}</strong>
              <span className="text-xs text-texto-suave">{actor.detalle}</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-[13px] text-right">
          <Button variant="ghost" size="sm" aria-expanded={abierto} aria-controls={panelId} onClick={() => setAbierto((actual) => !actual)}>
            {abierto ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            {abierto ? "Ocultar" : "Ver cambio"}
          </Button>
        </td>
      </tr>
      {abierto && <tr id={panelId} className="border-b border-borde bg-superficie-fila">
        <td colSpan={5} className="px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="etiqueta-mono">Resumen</p>
              <p className="text-sm font-medium">
                {resumen.titulo}
                {resumen.sujeto && <span className="font-normal text-texto-suave"> · {resumen.sujeto}</span>}
              </p>
              {motivo && <div className="rounded-input border border-borde bg-superficie px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-texto-suave">Motivo</p>
                <p className="mt-1">{motivo}</p>
              </div>}
            </div>
            <div className="space-y-3">
              {resumen.filas.length > 0 && <>
                <p className="etiqueta-mono">Campos modificados</p>
                <div className="overflow-hidden rounded-input border border-borde bg-superficie">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-borde text-left">
                        <th className="etiqueta-mono h-9 px-4 font-medium">Campo</th>
                        {resumen.mostrarAntes && <th className="etiqueta-mono h-9 px-4 font-medium">Antes</th>}
                        <th className="etiqueta-mono h-9 px-4 font-medium">{resumen.mostrarAntes ? "Después" : "Valor"}</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {resumen.filas.map((f) => (
                        <tr key={f.campo} className="border-b border-borde">
                          <td className="px-4 py-2.5 font-medium">{f.campo}</td>
                          {resumen.mostrarAntes && <td className="px-4 py-2.5 text-texto-suave">{f.antes}</td>}
                          <td className="px-4 py-2.5">{f.despues}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>}
              <details className="text-xs">
                <summary className="sin-marcador inline-flex cursor-pointer items-center gap-1.5 rounded-pill text-texto-suave hover:text-texto">
                  <Code aria-hidden="true" className="size-3.5" />Datos técnicos
                </summary>
                <pre className="mt-2 max-w-lg overflow-auto rounded-input bg-superficie-tenue p-3 font-mono text-[11px]">{datosTecnicos}</pre>
              </details>
            </div>
          </div>
        </td>
      </tr>}
    </Fragment>
  );
}
