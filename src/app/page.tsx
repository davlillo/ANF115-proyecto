import { redirect } from "next/navigation";
import { connection } from "next/server";
import { resolverAcceso } from "@/controladores/acceso.controller";
import { rutaInicial } from "@/config/navegacion";

/**
 * La raiz resuelve el destino inicial segun la sesion y la membresia.
 *
 * El administrador entra al panel consolidado; el empleado, a Ingresos.
 * `instant = false` evita el aviso de validacion de navegacion mientras el
 * destino dependa de la sesion.
 */
export const instant = false;

export default async function InicioPage() {
  await connection();
  const estado = await resolverAcceso();

  redirect(estado.estado === "ok" ? rutaInicial(estado.contexto.permisos) : "/login");
}
