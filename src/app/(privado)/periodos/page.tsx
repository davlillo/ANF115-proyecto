import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarDays, CalendarPlus, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { EmptyState } from "@/components/molecules/empty-state";
import { MetricCard } from "@/components/molecules/metric-card";
import { PageHeader } from "@/components/molecules/page-header";
import { SourceBadge } from "@/components/molecules/source-badge";
import { PeriodoForm } from "@/components/organisms/periodos/periodo-form";
import { pantallas } from "@/config/pantallas";
import { rutas } from "@/config/rutas";
import { listarPeriodosVista } from "@/controladores/periodos.controller";
import { formatearFechaCorta } from "@/lib/fechas";
import { crearPeriodoAction } from "./actions";

export const metadata: Metadata = {
  title: "Periodos",
};

export const instant = false;

type Props = {
  searchParams: Promise<{ anio?: string | string[] }>;
};

function parsearAnio(valor: string | string[] | undefined): number | null {
  if (typeof valor !== "string") {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) && numero >= 2000 && numero <= 2100
    ? numero
    : null;
}

export default async function PeriodosPage({ searchParams }: Props) {
  await connection();
  const parametros = await searchParams;
  const anioFiltro = parsearAnio(parametros.anio);
  const resultado = await listarPeriodosVista(anioFiltro);

  if (!resultado.ok) {
    if (resultado.error.codigo === "NO_AUTENTICADO") {
      redirect(rutas.login);
    }

    return (
      <div className="rounded-card border border-peligro/30 bg-superficie p-6">
        <h1 className="text-lg text-texto">No se pudieron cargar los periodos</h1>
        <p className="mt-2 text-sm text-texto-suave" role="alert">
          {resultado.error.mensaje}
        </p>
      </div>
    );
  }

  const { contexto, periodos, resumen, puedeGestionar, aniosDisponibles } =
    resultado.datos;
  const pantalla = pantallas.periodos.lista;
  const anioSugerido = resumen.ultimoAnio
    ? resumen.ultimoAnio + 1
    : new Date().getFullYear();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={pantalla.titulo}
        descripcion={pantalla.descripcion}
        contexto={
          <>
            <SourceBadge origen={contexto.origenDatos} />
            <Badge variant="outline">{contexto.empresaNombre}</Badge>
            <Badge variant="neutral">Rol {contexto.rolCodigo}</Badge>
          </>
        }
        acciones={
          puedeGestionar ? (
            <Button asChild>
              <Link href="#nuevo-periodo">
                <CalendarPlus aria-hidden="true" />
                Crear periodo
              </Link>
            </Button>
          ) : (
            <Badge variant="neutral">Lectura sin gestion</Badge>
          )
        }
      />

      <section
        aria-label="Resumen de periodos"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          etiqueta="Periodos"
          valor={resumen.total.toString()}
          detalle="Calendario mensual de la empresa."
          fuente="Tabla de periodos"
        />
        <MetricCard
          etiqueta="Abiertos"
          valor={resumen.abiertos.toString()}
          detalle="Admiten movimientos contables."
          fuente="estado = abierto"
        />
        <MetricCard
          etiqueta="Cerrados"
          valor={resumen.cerrados.toString()}
          detalle="El cierre completo se implementa en la Fase 05."
          fuente="estado = cerrado"
        />
        <MetricCard
          etiqueta="Ultimo año"
          valor={resumen.ultimoAnio?.toString() ?? "\u2014"}
          detalle="Año del periodo mas reciente."
          fuente="Calendario"
        />
      </section>

      {puedeGestionar ? (
        <section
          id="nuevo-periodo"
          aria-labelledby="nuevo-periodo-titulo"
          className="scroll-mt-24 rounded-card border border-borde bg-superficie p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarPlus aria-hidden="true" className="size-4 text-primario" />
            <div>
              <h2 id="nuevo-periodo-titulo" className="text-lg text-texto">
                Crear periodo
              </h2>
              <p className="text-xs text-texto-suave">
                Se crea abierto, con numeracion inicial y sin asientos.
              </p>
            </div>
          </div>
          <PeriodoForm
            accion={crearPeriodoAction}
            claveIdempotencia={randomUUID()}
            anioSugerido={anioSugerido}
          />
        </section>
      ) : null}

      <section aria-labelledby="lista-periodos" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="lista-periodos" className="flex items-center gap-2 text-lg text-texto">
              <CalendarDays aria-hidden="true" className="size-4 text-primario" />
              Calendario
            </h2>
            <p className="text-xs text-texto-suave">
              {resultado.datos.anioFiltro
                ? `Mostrando ${resultado.datos.anioFiltro}.`
                : "Mostrando todos los años."}
            </p>
          </div>

          <nav aria-label="Filtrar por año" className="flex flex-wrap gap-1.5">
            <Button
              asChild
              size="sm"
              variant={resultado.datos.anioFiltro === null ? "primary" : "secondary"}
            >
              <Link href={rutas.periodos.lista}>Todos</Link>
            </Button>
            {aniosDisponibles.map((anio) => (
              <Button
                key={anio}
                asChild
                size="sm"
                variant={
                  resultado.datos.anioFiltro === anio ? "primary" : "secondary"
                }
              >
                <Link href={`${rutas.periodos.lista}?anio=${anio}`}>{anio}</Link>
              </Button>
            ))}
          </nav>
        </div>

        {periodos.length === 0 ? (
          <EmptyState
            titulo="No hay periodos para mostrar"
            descripcion={
              resultado.datos.anioFiltro
                ? "El año seleccionado no tiene periodos. Crea el primero o cambia el filtro."
                : "Crea el primer periodo mensual para habilitar los movimientos contables."
            }
            icono={CalendarDays}
            accion={
              puedeGestionar ? (
                <Button asChild size="sm">
                  <Link href="#nuevo-periodo">Crear periodo</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Revision</TableHead>
                <TableHead className="hidden md:table-cell">Siguiente N.</TableHead>
                <TableHead className="hidden lg:table-cell">Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodos.map((periodo) => (
                <TableRow key={periodo.id}>
                  <TableCell className="font-medium">{periodo.etiqueta}</TableCell>
                  <TableCell className="text-xs text-texto-suave">
                    {formatearFechaCorta(periodo.inicio)}
                  </TableCell>
                  <TableCell className="text-xs text-texto-suave">
                    {formatearFechaCorta(periodo.fin)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={periodo.estado === "abierto" ? "success" : "neutral"}
                    >
                      {periodo.estado === "abierto" ? "Abierto" : "Cerrado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-xs text-texto-suave md:table-cell">
                    {periodo.revision}
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-xs text-texto-suave md:table-cell">
                    {periodo.siguienteNumeroAsiento}
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-xs text-texto-suave lg:table-cell">
                    {periodo.version}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-texto-suave">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          El cierre y la reapertura con snapshot corresponden a la Fase 05. Esta
          pantalla solo crea periodos abiertos y conserva su version.
        </p>
      </section>
    </div>
  );
}
