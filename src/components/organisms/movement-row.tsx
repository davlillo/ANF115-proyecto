"use client";

import { ArrowDownRight, ArrowUpRight, Ban, Clock3, Eye, TriangleAlert, UserRound } from "lucide-react";
import { Fragment, useId, useRef, useState } from "react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { StatusDot } from "@/components/atoms/status-dot";
import { OperationForm } from "@/components/organisms/operation-form";
import { formatearUSD } from "@/lib/dinero";
import { cn } from "@/lib/utils";
import type { AccionOperacion, Movimiento } from "@/types/finanzas";

type MovementRowProps = {
  movimiento: Movimiento;
  /** Codigo de la categoria (p. ej. I01), si esta disponible. */
  categoriaCodigo?: string;
  /** Fecha de anulacion ya formateada para mostrar. */
  anuladoEn: string;
  mostrarTipo: boolean;
  /** Si el modulo permite anular movimientos vigentes. */
  puedeAnular: boolean;
  /** Si la tabla tiene columna de acciones. */
  conAcciones: boolean;
  accion: AccionOperacion;
};

/**
 * Fila del detalle de movimientos con panel expandible en linea.
 * Vigentes: formulario de anulacion. Anulados: detalle de la anulacion.
 */
export function MovementRow({
  movimiento: m,
  categoriaCodigo,
  anuladoEn,
  mostrarTipo,
  puedeAnular,
  conAcciones,
  accion,
}: MovementRowProps) {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();
  const botonRef = useRef<HTMLButtonElement>(null);
  const anulado = m.estado === "anulado";
  const esIngreso = m.tipo === "ingreso";
  const columnas = 5 + (mostrarTipo ? 1 : 0) + (conAcciones ? 1 : 0);
  const hayAccion = anulado || puedeAnular;

  return (
    <Fragment>
      <tr className={cn("border-b border-borde align-middle", anulado ? "bg-peligro-fila" : "hover:bg-superficie-fila")}>
        <td className="whitespace-nowrap px-6 py-[13px] font-mono text-xs tabular-nums text-texto-2">{m.fecha}</td>
        <td className="min-w-44 px-6 py-[13px]">
          <span className="block text-sm font-medium">{m.concepto}</span>
          {m.referencia && <span className="mt-0.5 block font-mono text-[11px] text-texto-suave">{m.referencia}</span>}
        </td>
        <td className="px-6 py-[13px]">
          <span className="flex items-baseline gap-2">
            {categoriaCodigo && <span className={cn("font-mono text-[11px]", esIngreso ? "text-exito" : "text-acento")}>{categoriaCodigo}</span>}
            <span className="text-sm">{m.categoria}</span>
          </span>
        </td>
        {mostrarTipo && <td className="px-6 py-[13px]">
          <Badge variant={esIngreso ? "success" : "accent"}>
            {esIngreso ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
            {esIngreso ? "Ingreso" : "Gasto"}
          </Badge>
        </td>}
        <td className="px-6 py-[13px]">
          <StatusDot tono={anulado ? "danger" : "success"}>{anulado ? "Anulado" : "Vigente"}</StatusDot>
        </td>
        <td className={cn("whitespace-nowrap px-6 py-[13px] text-right font-mono text-sm tabular-nums", anulado ? "text-texto-suave" : esIngreso ? "text-exito" : "text-texto")}>
          {formatearUSD(m.monto)}
        </td>
        {conAcciones && <td className="px-6 py-[13px] text-right">
          {hayAccion ? <Button
            ref={botonRef}
            variant={abierto ? "secondary" : "ghost"} size="sm"
            aria-expanded={abierto} aria-controls={panelId}
            onClick={() => setAbierto((actual) => !actual)}
          >
            {anulado ? <Eye aria-hidden="true" /> : <Ban aria-hidden="true" />}
            {abierto ? "Cancelar" : anulado ? "Ver detalle" : "Anular"}
          </Button> : <span aria-label="Sin acciones disponibles" className="text-texto-suave">—</span>}
        </td>}
      </tr>
      {abierto && <tr id={panelId} className={cn("border-b border-borde", anulado ? "bg-peligro-fila" : "bg-superficie-fila")}>
        <td colSpan={columnas} className="px-6 py-5">
          {anulado ? <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="etiqueta-mono">Motivo</p>
              <p className="mt-1.5 leading-relaxed">{m.motivo_anulacion}</p>
            </div>
            <div className="flex gap-2"><UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-texto-suave" />
              <div><p className="etiqueta-mono">Anulado por</p><p className="mt-1.5 font-medium">{m.anulador ?? "Usuario autorizado"}</p></div></div>
            <div className="flex gap-2"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-texto-suave" />
              <div><p className="etiqueta-mono">Fecha de anulación</p><p className="mt-1.5 font-mono text-[13px] tabular-nums">{anuladoEn}</p></div></div>
          </div> : <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div className="flex gap-3 self-start rounded-input bg-peligro-tinte px-4 py-3 text-peligro">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <div className="text-[13px] leading-relaxed">
                <p className="font-semibold">Acción definitiva</p>
                <p>El movimiento se conserva y deja de contar en los totales.</p>
              </div>
            </div>
            <OperationForm accion={accion} operacion="anular" ocultos={{ tipo: m.tipo, id: m.id, revision: String(m.revision) }}
              presentacion="anulacion"
              alConfirmar={() => { setAbierto(false); botonRef.current?.focus(); }}
              campos={[{ nombre: "motivo", etiqueta: "Motivo de anulación (mínimo 5 caracteres)", requerido: true, tipo: "textarea", maxLength: 500 }]} texto="Confirmar anulación" />
          </div>}
        </td>
      </tr>}
    </Fragment>
  );
}
