import { ChevronDown, type LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.ComponentProps<"select"> & {
  icono?: LucideIcon;
  compacto?: boolean;
};

/**
 * Select nativo: conserva teclado, lectores de pantalla y comportamiento movil
 * con un picker personalizado por CSS cuando el navegador lo admite.
 */
export function Select({
  className,
  children,
  icono: Icono,
  compacto = false,
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full">
      {Icono ? (
        <Icono
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
        />
      ) : null}
      <select
        className={cn(
          "select-control w-full min-w-0 cursor-pointer rounded-input border border-borde-fuerte bg-superficie pr-9 text-sm text-texto transition-colors hover:border-texto-suave",
          compacto ? "h-[38px]" : "h-10",
          Icono ? "pl-10" : "pl-3.5",
          "focus-visible:border-[1.5px] focus-visible:border-texto focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:bg-superficie-tenue disabled:text-texto-suave",
          "aria-invalid:border-peligro",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
      />
    </div>
  );
}
