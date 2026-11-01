import { Clock } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageHeader } from "@/components/molecules/page-header";
import { SourceBadge } from "@/components/molecules/source-badge";
import type { Pantalla } from "@/config/pantallas";

type ModulePlaceholderProps = {
  pantalla: Pantalla;
  parametros?: Readonly<Record<string, string>>;
};

/**
 * Pantalla del cascaron.
 *
 * Declara explicitamente que la funcionalidad no esta implementada. No muestra
 * cifras, tablas ni resultados simulados como si fueran calculos reales.
 */
export function ModulePlaceholder({
  pantalla,
  parametros,
}: ModulePlaceholderProps) {
  const entradas = Object.entries(parametros ?? {});

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={pantalla.titulo}
        descripcion={pantalla.descripcion}
        contexto={
          <>
            <Badge variant="warning">En construccion</Badge>
            <Badge variant="outline">Fase {pantalla.fase}</Badge>
            <Badge variant="neutral">{pantalla.acceso}</Badge>
            {pantalla.notaFase ? (
              <Badge variant="info">{pantalla.notaFase}</Badge>
            ) : null}
            <SourceBadge />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <EmptyState
          icono={Clock}
          titulo="Pantalla en construccion"
          descripcion={`La ruta ${pantalla.ruta} ya existe y forma parte del cascaron. Su contenido funcional se construye en la fase ${pantalla.fase}, con contrato, permisos, datos y pruebas propias.`}
        />

        <aside className="space-y-4 rounded-card border border-borde bg-superficie p-5">
          <div>
            <h2 className="text-sm font-semibold text-texto">
              Checklist de construccion
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-texto-suave">
              La pantalla se acepta cuando cumple el documento 09 y su caso de
              uso del documento 10.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-texto-suave">
            {[
              "Contexto de empresa y periodo",
              "Filtros reproducibles en la URL",
              "Accion principal y permisos",
              "Estados vacio, carga, error y sin permiso",
              "Etiqueta de datos simulados",
              "Accesibilidad por teclado",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-borde-fuerte"
                />
                {item}
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-borde pt-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-suave">Ruta</dt>
              <dd className="font-mono text-texto">{pantalla.ruta}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-suave">Permiso</dt>
              <dd className="text-right text-texto">{pantalla.acceso}</dd>
            </div>
            {entradas.map(([clave, valor]) => (
              <div
                key={clave}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-texto-suave">{clave}</dt>
                <dd className="font-mono text-texto">{valor}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
