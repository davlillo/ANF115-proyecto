import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

/** Etiqueta (tag) en pildora: fondo tintado, texto fuerte e icono opcional. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-[3px] text-xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-superficie-tenue text-texto-2",
        primary: "bg-acento-tinte text-acento",
        accent: "bg-acento-tinte text-acento",
        success: "bg-exito-tinte text-exito",
        warning: "bg-advertencia-tinte text-advertencia",
        danger: "bg-peligro-tinte text-peligro",
        info: "bg-info-tinte text-info",
        outline: "border border-borde-fuerte bg-transparent text-texto-suave",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
