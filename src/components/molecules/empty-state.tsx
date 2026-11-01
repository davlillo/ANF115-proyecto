import { CircleHelp, type LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  accion?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  titulo,
  descripcion,
  icono: Icono = CircleHelp,
  accion,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-borde-fuerte bg-superficie px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-superficie-tenue text-texto-2">
        <Icono aria-hidden="true" className="size-5" />
      </span>
      <div className="max-w-md space-y-1">
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-texto">{titulo}</p>
        {descripcion ? (
          <p className="text-sm leading-relaxed text-texto-suave">
            {descripcion}
          </p>
        ) : null}
      </div>
      {accion ? <div className="pt-1">{accion}</div> : null}
    </div>
  );
}
