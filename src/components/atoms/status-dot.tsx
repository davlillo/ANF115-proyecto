import type * as React from "react";
import { cn } from "@/lib/utils";

const TONOS = {
  success: "bg-exito",
  danger: "bg-peligro",
  warning: "bg-advertencia",
  neutral: "bg-texto-suave",
} as const;

type StatusDotProps = {
  tono: keyof typeof TONOS;
  children: React.ReactNode;
  className?: string;
};

/** Estado con punto de color y texto; el texto evita depender solo del color. */
export function StatusDot({ tono, children, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] text-texto", className)}>
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TONOS[tono])} />
      {children}
    </span>
  );
}
