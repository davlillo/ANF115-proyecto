import { cn } from "@/lib/utils";

type SourceBadgeProps = {
  origen?: "simulado" | "real";
  className?: string;
};

/**
 * Etiqueta obligatoria de procedencia.
 *
 * Un resultado academico nunca se presenta como dato real.
 */
export function SourceBadge({
  origen = "simulado",
  className,
}: SourceBadgeProps) {
  const esSimulado = origen === "simulado";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-pill border border-borde-fuerte px-3 py-1 text-xs font-medium text-texto-2",
        className,
      )}
      title={
        esSimulado
          ? "Información de demostración"
          : "Datos declarados como reales por la empresa"
      }
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", esSimulado ? "bg-advertencia" : "bg-info")}
      />
      {esSimulado ? "Datos simulados" : "Datos reales"}
    </span>
  );
}
