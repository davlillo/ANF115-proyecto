import { Check, Croissant } from "lucide-react";
import type * as React from "react";

type AuthTemplateProps = {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
};

const BENEFICIOS = [
  "Ingresos y gastos organizados por categoría.",
  "Indicadores y reportes verificables por período.",
  "Acceso por rol y bitácora de cambios confirmados.",
] as const;

/**
 * Plantilla de acceso: panel de marca oscuro a la izquierda, formulario a la
 * derecha. En pantallas pequenas se conserva la marca y se prioriza el formulario.
 */
export function AuthTemplate({
  titulo,
  descripcion,
  children,
}: AuthTemplateProps) {
  return (
    <div className="min-h-dvh bg-fondo lg:grid lg:grid-cols-2">
      <section aria-label="Carlitos Finanzas" className="hidden min-w-0 flex-col justify-between gap-12 bg-[radial-gradient(ellipse_at_0%_100%,var(--acceso-brillo),var(--tinta)_62%)] p-10 text-fondo lg:flex xl:p-14">
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 items-center justify-center rounded-input bg-fondo text-texto">
            <Croissant aria-hidden="true" className="size-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-semibold tracking-[-0.02em]">Carlitos</span>
            <span className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fondo/60">Finanzas</span>
          </span>
        </div>

        <div className="max-w-lg space-y-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-acceso-eyebrow">
            Control financiero
          </p>
          <h2 className="text-[clamp(2rem,3.2vw,3rem)] font-medium leading-[1.1] tracking-[-0.035em] text-fondo">
            Decisiones con números que se pueden explicar.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-fondo/70">
            Un solo lugar para registrar cobros y pagos, consultar reportes
            y comprender los resultados de la panadería.
          </p>
          <ul className="space-y-3 pt-2 text-[15px] text-fondo/90">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fondo/10 text-acceso-eyebrow"
                >
                  <Check className="size-3.5" />
                </span>
                {beneficio}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-fondo/50">
          <span>Panadería Carlitos &middot; 2026</span>
        </div>
      </section>

      <main id="contenido-principal" className="flex min-h-dvh min-w-0 items-center justify-center px-6 py-8 sm:px-10 lg:py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-[34px] items-center justify-center rounded-input bg-primario text-acento-tinte">
              <Croissant aria-hidden="true" className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-[-0.02em]">Carlitos Finanzas</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-texto">{titulo}</h1>
            <p className="text-sm leading-relaxed text-texto-suave">
              {descripcion}
            </p>
          </div>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-xs leading-relaxed text-texto-suave">
            Panadería Carlitos · Datos simulados
          </p>
        </div>
      </main>
    </div>
  );
}
