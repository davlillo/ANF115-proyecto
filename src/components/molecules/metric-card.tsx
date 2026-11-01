import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const TONOS_ICONO = {
  success: "bg-exito-tinte text-exito",
  accent: "bg-acento-tinte text-acento",
  neutral: "bg-superficie-tenue text-texto-2",
} as const;

type MetricCardProps = {
  etiqueta: string;
  valor: React.ReactNode;
  detalle?: string;
  fuente?: string;
  icono?: LucideIcon;
  tonoIcono?: keyof typeof TONOS_ICONO;
  className?: string;
};

/**
 * Tarjeta de indicador: etiqueta mono, icono tintado arriba a la derecha,
 * valor grande y pie con contexto. Solo presenta el valor recibido.
 */
export function MetricCard({
  etiqueta,
  valor,
  detalle,
  fuente,
  icono: Icono,
  tonoIcono = "neutral",
  className,
}: MetricCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-card border border-borde bg-superficie p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="etiqueta-mono">{etiqueta}</h2>
        {Icono ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              TONOS_ICONO[tonoIcono],
            )}
          >
            <Icono aria-hidden="true" className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="text-[32px] font-medium leading-none tracking-[-0.04em] tabular-nums text-texto">
        {valor}
      </div>
      {detalle ? (
        <p className="text-xs leading-relaxed text-texto-suave">{detalle}</p>
      ) : null}
      {fuente ? (
        <p className="mt-auto border-t border-borde pt-2 text-[11px] text-texto-suave">
          {fuente}
        </p>
      ) : null}
    </section>
  );
}
