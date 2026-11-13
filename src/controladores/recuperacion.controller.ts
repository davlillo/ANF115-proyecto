import "server-only";
import { z } from "zod";
import { enviarRecuperacion, verificarTokenRecuperacion, verificarSesionRecuperacion, cambiarContrasena } from "@/repositorios/recuperacion.repository";
import { generarRequestId, ok, fallo, desdeError } from "@/lib/resultado";
import { contrasenaSchema } from "@/schemas/finanzas.schema";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";

export async function solicitarRecuperacion(correo: unknown) {
  const requestId = generarRequestId();
  const v = z.email().safeParse(correo);
  if (!v.success) return fallo("VALIDACION_ENTRADA", requestId, { mensaje: "Indique un correo válido." });
  try { await enviarRecuperacion(v.data); return ok(null, requestId); }
  catch (e) { return desdeError(e, requestId); }
}

export async function confirmarRecuperacion(token: unknown) {
  const requestId = generarRequestId();
  const v = z.string().min(20).max(512).safeParse(token);
  if (!v.success) return fallo("NO_AUTENTICADO", requestId);
  try { await verificarTokenRecuperacion(v.data); return ok(null, requestId); }
  catch (e) { return desdeError(e, requestId); }
}

export async function consultarRecuperacion() {
  const requestId = generarRequestId();
  try { await verificarSesionRecuperacion(); return ok(null, requestId); }
  catch (e) { return desdeError(e, requestId); }
}

export async function restablecerContrasena(input: Record<string, unknown>) {
  const requestId = generarRequestId();
  const v = z.object({ contrasena: contrasenaSchema, confirmacion: z.string() })
    .refine((v) => v.contrasena === v.confirmacion).safeParse(input);
  if (!v.success) return fallo("VALIDACION_ENTRADA", requestId, { mensaje: `Las contraseñas deben coincidir y tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.` });
  try {
    await verificarSesionRecuperacion(); await cambiarContrasena(v.data.contrasena);
    return ok(null, requestId);
  } catch (e) { return desdeError(e, requestId); }
}
