import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<React.ComponentProps<"input">, "prefix"> & {
  /** Icono decorativo a la izquierda (calendario, busqueda, correo, candado). */
  icono?: LucideIcon;
  /** Prefijo textual en mono, p. ej. "$" para importes. */
  prefijo?: string;
  /** Altura de 38px para barras de filtros. */
  compacto?: boolean;
  /** Contenido a la derecha dentro del campo (p. ej. boton de mostrar). */
  sufijo?: React.ReactNode;
  contenedorClassName?: string;
};

export function Input({
  className,
  contenedorClassName,
  type = "text",
  icono: Icono,
  prefijo,
  sufijo,
  compacto = false,
  ...props
}: InputProps) {
  const campo = (
    <input
      type={type}
      className={cn(
        "flex w-full rounded-input border border-borde-fuerte bg-superficie px-3.5 text-sm text-texto transition-colors",
        compacto ? "h-[38px]" : "h-10",
        "placeholder:text-texto-suave/70",
        "focus-visible:border-[1.5px] focus-visible:border-texto focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-superficie-tenue disabled:text-texto-suave",
        "aria-invalid:border-peligro focus-visible:aria-invalid:border-peligro",
        Icono && "pl-10",
        prefijo && "pl-9 font-mono",
        sufijo ? "pr-11" : undefined,
        className,
      )}
      {...props}
    />
  );

  if (!Icono && !prefijo && !sufijo) {
    return campo;
  }

  return (
    <div className={cn("relative w-full", contenedorClassName)}>
      {Icono ? (
        <Icono
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
        />
      ) : null}
      {prefijo ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-texto-suave"
        >
          {prefijo}
        </span>
      ) : null}
      {campo}
      {sufijo ? (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{sufijo}</span>
      ) : null}
    </div>
  );
}
