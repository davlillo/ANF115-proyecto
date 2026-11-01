import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const TONOS: Record<"info" | "success" | "warning" | "danger", { clases: string; icono: LucideIcon }> = {
  info: { clases: "bg-info-tinte text-info", icono: Info },
  success: { clases: "bg-exito-tinte text-exito", icono: CircleCheck },
  warning: { clases: "bg-advertencia-tinte text-advertencia", icono: TriangleAlert },
  danger: { clases: "bg-peligro-tinte text-peligro", icono: CircleAlert },
};

type BannerProps = React.ComponentProps<"div"> & {
  tono?: keyof typeof TONOS;
  icono?: LucideIcon;
};

/** Aviso en linea: fondo tintado, icono y texto en el color del tono. */
export function Banner({ tono = "info", icono, className, children, ...props }: BannerProps) {
  const Icono = icono ?? TONOS[tono].icono;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-input px-4 py-3 text-[13px] leading-relaxed",
        TONOS[tono].clases,
        className,
      )}
      {...props}
    >
      <Icono aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
