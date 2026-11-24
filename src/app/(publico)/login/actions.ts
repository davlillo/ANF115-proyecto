"use server";

import { redirect } from "next/navigation";
import { iniciarSesion } from "@/controladores/acceso.controller";
import { camposDesdeZod } from "@/lib/validacion";
import { iniciarSesionSchema } from "@/schemas/contabilidad.schema";
import type { EstadoFormulario } from "@/types/formularios";

export async function iniciarSesionAction(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const entrada = {
    correo: String(formData.get("correo") ?? ""),
    contrasena: String(formData.get("contrasena") ?? ""),
  };

  const validacion = iniciarSesionSchema.safeParse(entrada);

  if (!validacion.success) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados.",
      campos: camposDesdeZod(validacion.error).map((campo) => ({
        ruta: campo.ruta,
        mensaje: campo.mensaje,
      })),
    };
  }

  const resultado = await iniciarSesion(validacion.data);

  if (!resultado.ok) {
    return {
      estado: "error",
      mensaje: resultado.error.mensaje,
      campos: resultado.error.campos?.map((campo) => ({
        ruta: campo.ruta,
        mensaje: campo.mensaje,
      })),
    };
  }

  // La raiz decide el destino: panel para administracion, Ingresos para el empleado.
  redirect("/");
}
