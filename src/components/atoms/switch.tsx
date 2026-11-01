import type * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<React.ComponentProps<"button">, "role" | "aria-checked"> & {
  activo: boolean;
};

/** Interruptor 36x20: verde si esta activo, gris si no. Boton con role="switch". */
export function Switch({ activo, className, type = "button", ...props }: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={activo}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-pill transition-colors disabled:cursor-wait disabled:opacity-60",
        activo ? "bg-exito" : "bg-borde-fuerte",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[2px] size-4 rounded-full bg-white transition-transform",
          activo ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
