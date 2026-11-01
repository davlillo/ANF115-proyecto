import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Badge } from "@/components/atoms/badge";
import { PageHeader } from "@/components/molecules/page-header";
import { AccountForm } from "@/components/organisms/catalogo/account-form";
import { pantallas } from "@/config/pantallas";
import { rutas } from "@/config/rutas";
import { listarOpcionesCatalogo } from "@/controladores/catalogo.controller";
import { guardarCuentaAction } from "../actions";

export const metadata: Metadata = {
  title: "Nueva cuenta",
};

export const instant = false;

export default async function NuevaCuentaPage() {
  await connection();
  const resultado = await listarOpcionesCatalogo();

  if (!resultado.ok) {
    if (resultado.error.codigo === "NO_AUTENTICADO") {
      redirect(rutas.login);
    }

    return (
      <div className="rounded-card border border-peligro/30 bg-superficie p-6">
        <h1 className="text-lg text-texto">No se pudo abrir el formulario</h1>
        <p className="mt-2 text-sm text-texto-suave" role="alert">
          {resultado.error.mensaje}
        </p>
      </div>
    );
  }

  const opciones = resultado.datos;
  const pantalla = pantallas.catalogo.nueva;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={pantalla.titulo}
        descripcion={pantalla.descripcion}
        contexto={
          <>
            <Badge variant="primary">CU-03</Badge>
            <Badge variant="outline">catalogo.publicar</Badge>
            <Badge variant="neutral">Auditoria obligatoria</Badge>
          </>
        }
      />

      {opciones.rubros.length === 0 ? (
        <p
          role="alert"
          className="rounded-input border border-advertencia/30 bg-advertencia/10 px-4 py-3 text-sm text-advertencia"
        >
          No hay rubros publicados para esta empresa. Un administrador debe
          cargar la clasificacion antes de crear cuentas.
        </p>
      ) : (
        <div className="max-w-4xl rounded-card border border-borde bg-superficie p-5 sm:p-6">
          <AccountForm
            accion={guardarCuentaAction}
            opciones={opciones}
            claveIdempotencia={randomUUID()}
          />
        </div>
      )}
    </div>
  );
}
