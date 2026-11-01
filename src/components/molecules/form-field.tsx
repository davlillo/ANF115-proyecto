import { CircleAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
  /** Contenido a la derecha de la etiqueta (p. ej. enlace de recuperacion). */
  accesorio?: React.ReactNode;
  children: React.ReactNode;
};

export function FormField({
  id,
  etiqueta,
  ayuda,
  error,
  requerido = false,
  className,
  accesorio,
  children,
}: FormFieldProps) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-texto-2">
          {etiqueta}
          {requerido ? (
            <span className="ml-1 text-peligro" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {accesorio}
      </div>
      {children}
      {ayuda ? (
        <p id={ayudaId} className="text-xs text-texto-suave">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-peligro">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
