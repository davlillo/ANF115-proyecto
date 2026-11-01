import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { FolderTree, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { EmptyState } from "@/components/molecules/empty-state";
import { MetricCard } from "@/components/molecules/metric-card";
import { PageHeader } from "@/components/molecules/page-header";
import { SourceBadge } from "@/components/molecules/source-badge";
import { AccountsTree } from "@/components/organisms/catalogo/accounts-tree";
import { pantallas } from "@/config/pantallas";
import { rutas } from "@/config/rutas";
import { listarCatalogo } from "@/controladores/catalogo.controller";
import { busquedaCatalogoSchema } from "@/schemas/contabilidad.schema";

export const metadata: Metadata = {
  title: "Catalogo",
};

export const instant = false;

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
  await connection();
  const parametros = await searchParams;
  const bruto = typeof parametros.q === "string" ? parametros.q : "";
  const validacion = busquedaCatalogoSchema.safeParse(bruto);
  const busqueda = validacion.success ? validacion.data : "";

  const resultado = await listarCatalogo(busqueda);

  if (!resultado.ok) {
    if (resultado.error.codigo === "NO_AUTENTICADO") {
      redirect(rutas.login);
    }

    return (
      <div className="rounded-card border border-peligro/30 bg-superficie p-6">
        <h1 className="text-lg text-texto">No se pudo cargar el catalogo</h1>
        <p className="mt-2 text-sm text-texto-suave" role="alert">
          {resultado.error.mensaje}
        </p>
      </div>
    );
  }

  const { contexto, filas, resumen, puedeEditar } = resultado.datos;
  const pantalla = pantallas.catalogo.lista;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={pantalla.titulo}
        descripcion={pantalla.descripcion}
        contexto={
          <>
            <SourceBadge origen={contexto.origenDatos} />
            <Badge variant="outline">{contexto.empresaNombre}</Badge>
            <Badge variant="outline">{contexto.moneda}</Badge>
            <Badge variant="neutral">Rol {contexto.rolCodigo}</Badge>
          </>
        }
        acciones={
          puedeEditar ? (
            <Button asChild>
              <Link href={rutas.catalogo.nueva}>
                <FolderTree aria-hidden="true" />
                Nueva cuenta
              </Link>
            </Button>
          ) : (
            <Badge variant="neutral">Lectura sin publicacion</Badge>
          )
        }
      />

      <section
        aria-label="Resumen del catalogo"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          etiqueta="Cuentas"
          valor={resumen.total.toString()}
          detalle="Incluye agrupadoras y cuentas de movimiento."
          fuente="Catalogo de la empresa"
        />
        <MetricCard
          etiqueta="De movimiento"
          valor={resumen.movimiento.toString()}
          detalle="Pueden recibir lineas de asiento."
          fuente="permite_movimiento = true"
        />
        <MetricCard
          etiqueta="Agrupadoras"
          valor={resumen.agrupadoras.toString()}
          detalle="Ordenan la jerarquia y no reciben lineas."
          fuente="permite_movimiento = false"
        />
        <MetricCard
          etiqueta="Correctoras"
          valor={resumen.correctoras.toString()}
          detalle={`${resumen.inactivas} cuentas inactivas conservan historia.`}
          fuente="es_correctora = true"
        />
      </section>

      <section aria-labelledby="catalogo-titulo" className="space-y-3">
        <div className="flex flex-col gap-3 rounded-card border border-borde bg-superficie p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="catalogo-titulo" className="flex items-center gap-2 text-lg text-texto">
              <SlidersHorizontal aria-hidden="true" className="size-4 text-primario" />
              Arbol de cuentas
            </h2>
            <p className="text-xs text-texto-suave">
              Codigo como texto, jerarquia por padre y clasificacion explicita.
            </p>
          </div>

          <form
            action={rutas.catalogo.lista}
            method="get"
            className="flex w-full gap-2 sm:w-auto"
            role="search"
          >
            <label htmlFor="q" className="sr-only">
              Buscar cuenta por codigo o nombre
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={busqueda}
              placeholder="Codigo o nombre"
              className="h-9 sm:w-64"
              maxLength={60}
            />
            <Button type="submit" variant="secondary" size="sm">
              <Search aria-hidden="true" />
              Buscar
            </Button>
          </form>
        </div>

        {filas.length === 0 ? (
          <EmptyState
            titulo={busqueda ? "Sin resultados" : "El catalogo esta vacio"}
            descripcion={
              busqueda
                ? "No hay cuentas que coincidan con la busqueda. Revisa el codigo o el nombre."
                : "Crea la primera cuenta para empezar a clasificar los movimientos contables."
            }
            icono={FolderTree}
            accion={
              busqueda ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={rutas.catalogo.lista}>Limpiar busqueda</Link>
                </Button>
              ) : puedeEditar ? (
                <Button asChild size="sm">
                  <Link href={rutas.catalogo.nueva}>Crear cuenta</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <AccountsTree filas={filas} />
        )}

        <p className="text-[11px] leading-relaxed text-texto-suave">
          Catalogo inicial revisado para la simulacion. Las naturalezas de gastos
          se guardan de forma explicita; la ratificacion funcional definitiva
          sigue registrada como PD-01 en el documento 20.
        </p>
      </section>
    </div>
  );
}
