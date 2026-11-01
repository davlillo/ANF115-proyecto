import type * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  titulo: string;
  descripcion?: string;
  /** Linea mono sobre el titulo, p. ej. "OPERACION · COBROS Y PAGOS". */
  eyebrow?: string;
  acciones?: React.ReactNode;
  contexto?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  titulo,
  descripcion,
  eyebrow,
  acciones,
  contexto,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? <p className="etiqueta-mono text-[11px]">{eyebrow}</p> : null}
        <h1 className="text-[34px] font-medium leading-[1.1] tracking-[-0.03em] text-texto">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="max-w-2xl text-sm leading-relaxed text-texto-suave">
            {descripcion}
          </p>
        ) : null}
        {contexto ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {contexto}
          </div>
        ) : null}
      </div>
      {acciones ? (
        <div className="flex flex-wrap items-center gap-2">{acciones}</div>
      ) : null}
    </header>
  );
}
