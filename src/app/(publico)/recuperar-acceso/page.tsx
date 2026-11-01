import Link from "next/link";
import { AuthTemplate } from "@/components/templates/auth-template";
import { OperationForm } from "@/components/organisms/operation-form";
import { rutas } from "@/config/rutas";
import { recuperarAccesoAction } from "./actions";

export const metadata = { title: "Recuperar acceso" };

export default function Page() {
  return <AuthTemplate titulo="Recuperar acceso" descripcion="Solicite un enlace de un solo uso para cambiar su contraseña.">
    <OperationForm accion={recuperarAccesoAction} operacion="recuperar" campos={[
      { nombre: "correo", etiqueta: "Correo de la cuenta", tipo: "email", requerido: true },
    ]} texto="Enviar enlace" />
    <Link className="mt-5 inline-block text-sm text-acento hover:underline" href={rutas.login}>Volver al acceso</Link>
  </AuthTemplate>;
}
