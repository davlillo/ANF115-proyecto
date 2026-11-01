import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { PageHeader } from "@/components/molecules/page-header";
import { SourceBadge } from "@/components/molecules/source-badge";
import { AccountForm } from "@/components/organisms/catalogo/account-form";
import { pantallas } from "@/config/pantallas";
import { rutas } from "@/config/rutas";
import {
  listarOpcionesCatalogo,
  obtenerCuentaDetalle,
} from "@/controladores/catalogo.controller";
import { formatearFechaCorta } from "@/lib/fechas";
import { guardarCuentaAction } from "../actions";

export const metadata: Metadata = {
  title: "Detalle de cuenta",
};

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

const ETIQUETAS_CLASE: Record<string, string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio",
  ingreso: "Ingreso",
  gasto: "Gasto",
};

export default async function CuentaDetallePage({ params }: Props) {
  await connection();
  const { id } = await params;
  const resultado = await obtenerCuentaDetalle(id);

  if (!resultado.ok) {
    if (resultado.error.codigo === "RECURSO_NO_ENCONTRADO") {
      notFound();
    }

    if (resultado.error.codigo === "NO_AUTENTICADO") {
      redirect(rutas.login);
    }

    return (
      <div className="rounded-card border border-peligro/30 bg-superficie p-6">
        <h1 className="text-lg text-texto">No se pudo cargar la cuenta</h1>
        <p className="mt-2 text-sm text-texto-suave" role="alert">
          {resultado.error.mensaje}
        </p>
      </div>
    );
  }

  const { contexto, cuenta, puedeEditar } = resultado.datos;
  const opcionesResultado = puedeEditar
    ? await listarOpcionesCatalogo(cuenta.id)
    : null;
  const pantalla = pantallas.catalogo.detalle;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={cuenta.nombre}
        descripcion={pantalla.descripcion}
        contexto={
          <>
            <Badge variant="primary">{cuenta.codigo}</Badge>
            <Badge variant="outline">
              {ETIQUETAS_CLASE[cuenta.clase] ?? cuenta.clase}
            </Badge>
            <Badge variant="outline">
              {cuenta.naturaleza === "deudora" ? "Deudora" : "Acreedora"}
            </Badge>
            <Badge variant={cuenta.activa ? "success" : "warning"}>
              {cuenta.activa ? "Activa" : "Inactiva"}
            </Badge>
            <SourceBadge origen={contexto.origenDatos} />
          </>
        }
        acciones={
          <Button asChild variant="secondary" size="sm">
            <Link href={rutas.catalogo.lista}>Volver al catalogo</Link>
          </Button>
        }
      />

      <section
        aria-label="Datos de la cuenta"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Rubro
          </p>
          <p className="mt-1 text-sm text-texto">{cuenta.rubroNombre}</p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Jerarquia
          </p>
          <p className="mt-1 text-sm text-texto">
            {cuenta.padreId ? "Cuenta dependiente" : "Cuenta raiz"}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Movimiento
          </p>
          <p className="mt-1 text-sm text-texto">
            {cuenta.permiteMovimiento
              ? "Admite lineas de asiento"
              : "Solo agrupa cuentas"}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Version
          </p>
          <p className="mt-1 text-sm tabular-nums text-texto">
            {cuenta.version}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Vigencia desde
          </p>
          <p className="mt-1 text-sm text-texto">
            {formatearFechaCorta(cuenta.vigenciaDesde)}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Vigencia hasta
          </p>
          <p className="mt-1 text-sm text-texto">
            {cuenta.vigenciaHasta
              ? formatearFechaCorta(cuenta.vigenciaHasta)
              : "Sin fecha de fin"}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Correctora
          </p>
          <p className="mt-1 text-sm text-texto">
            {cuenta.esCorrectora ? "Si, reduce su rubro" : "No"}
          </p>
        </div>
        <div className="rounded-card border border-borde bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Empresa
          </p>
          <p className="mt-1 text-sm text-texto">{contexto.empresaNombre}</p>
        </div>
      </section>

      {puedeEditar ? (
        <section aria-labelledby="editar-cuenta" className="space-y-3">
          <div>
            <h2 id="editar-cuenta" className="text-lg text-texto">
              Editar cuenta
            </h2>
            <p className="text-xs text-texto-suave">
              El codigo no cambia. Cada cambio exige motivo y version vigente.
            </p>
          </div>

          {opcionesResultado && !opcionesResultado.ok ? (
            <p
              role="alert"
              className="rounded-input border border-peligro/30 bg-peligro/5 px-4 py-3 text-sm text-peligro"
            >
              {opcionesResultado.error.mensaje}
            </p>
          ) : null}

          {opcionesResultado?.ok ? (
            <div className="rounded-card border border-borde bg-superficie p-5 sm:p-6">
              <AccountForm
                accion={guardarCuentaAction}
                opciones={opcionesResultado.datos}
                claveIdempotencia={randomUUID()}
              />
            </div>
          ) : null}
        </section>
      ) : (
        <p className="rounded-input border border-borde bg-superficie-tenue px-4 py-3 text-sm text-texto-suave">
          Tu rol puede consultar el catalogo, pero no publicar cambios.
        </p>
      )}
    </div>
  );
}
