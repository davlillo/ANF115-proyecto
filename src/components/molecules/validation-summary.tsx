import { Banner } from "@/components/molecules/banner";
import { cn } from "@/lib/utils";

export type ErrorValidacion = {
  ruta: string;
  mensaje: string;
};

type ValidationSummaryProps = {
  errores?: readonly ErrorValidacion[];
  mensajeExito?: string;
  className?: string;
};

export function ValidationSummary({
  errores = [],
  mensajeExito,
  className,
}: ValidationSummaryProps) {
  const hayErrores = errores.length > 0;

  if (!hayErrores && !mensajeExito) {
    return null;
  }

  return (
    <Banner
      tono={hayErrores ? "danger" : "success"}
      role={hayErrores ? "alert" : "status"}
      aria-live="polite"
      className={cn(className)}
    >
      <div className="space-y-1">
        {hayErrores ? (
          <>
            <p className="font-semibold">Revisa la información:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {errores.map((error) => (
                <li key={`${error.ruta}-${error.mensaje}`}>
                  <span className="font-medium">{error.ruta}:</span>{" "}
                  {error.mensaje}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="font-medium">{mensajeExito}</p>
        )}
      </div>
    </Banner>
  );
}
