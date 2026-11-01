import Link from "next/link";
import { connection } from "next/server";
import { consultarRecuperacion } from "@/controladores/recuperacion.controller";
import { AuthTemplate } from "@/components/templates/auth-template";
import { OperationForm } from "@/components/organisms/operation-form";
import { rutas } from "@/config/rutas";
import { restablecerAccesoAction } from "../recuperar-acceso/actions";

export const metadata = { title: "Restablecer contraseña" };
export const instant = false;

export default async function Page() {
  await connection();
  const r = await consultarRecuperacion();
  return <AuthTemplate titulo="Restablecer contraseña" descripcion="Use una contraseña nueva de al menos 12 caracteres.">
    {r.ok ? <OperationForm accion={restablecerAccesoAction} operacion="restablecer" campos={[
      { nombre: "contrasena", etiqueta: "Nueva contraseña", tipo: "password", requerido: true },
      { nombre: "confirmacion", etiqueta: "Confirmar contraseña", tipo: "password", requerido: true },
    ]} texto="Actualizar contraseña" /> : <p role="alert" className="text-sm text-peligro">{r.error.mensaje}</p>}
    <Link className="mt-5 inline-block text-sm text-acento hover:underline" href={r.ok ? rutas.login : rutas.recuperarAcceso}>{r.ok ? "Iniciar sesión" : "Solicitar otro enlace"}</Link>
  </AuthTemplate>;
}
