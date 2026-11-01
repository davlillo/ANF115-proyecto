import type * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-input border border-borde-fuerte bg-superficie px-3.5 py-2.5 text-sm text-texto transition-colors",
        "placeholder:text-texto-suave/70",
        "focus-visible:border-[1.5px] focus-visible:border-texto focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-superficie-tenue disabled:text-texto-suave",
        "aria-invalid:border-peligro focus-visible:aria-invalid:border-peligro",
        className,
      )}
      {...props}
    />
  );
}
