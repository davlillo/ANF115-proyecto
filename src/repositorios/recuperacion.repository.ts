import "server-only";
import { crearClienteFinanzas } from "@/supabase/finanzas.server";
import { obtenerEnvServidor } from "@/config/env.server";
import { rutas } from "@/config/rutas";
import { ErrorDominio } from "@/lib/errores";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";

export async function enviarRecuperacion(correo: string): Promise<void> {
  const c = await crearClienteFinanzas();
  const { error } = await c.auth.resetPasswordForEmail(correo, {
    redirectTo: new URL(rutas.confirmarRecuperacion, obtenerEnvServidor().APP_ORIGIN).toString(),
  });
  if (error) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "No se pudo procesar la solicitud. Espere antes de reintentar y verifique el correo local.");
  // The public response intentionally does not disclose whether an account exists.
}

export async function verificarTokenRecuperacion(tokenHash: string): Promise<void> {
  const c = await crearClienteFinanzas();
  const { error } = await c.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error) throw new ErrorDominio("NO_AUTENTICADO", "El enlace no es válido o ya expiró. Solicite uno nuevo.");
}

export async function verificarSesionRecuperacion(): Promise<void> {
  const c = await crearClienteFinanzas();
  const { data: { user }, error } = await c.auth.getUser();
  if (!user || error) throw new ErrorDominio("NO_AUTENTICADO", "Abra el enlace de recuperación enviado a su correo.");
}

export async function cambiarContrasena(contrasena: string): Promise<void> {
  const c = await crearClienteFinanzas();
  const { error } = await c.auth.updateUser({ password: contrasena });
  if (error) throw new ErrorDominio("VALIDACION_ENTRADA", `No se pudo actualizar la contraseña. Use una nueva de al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres o solicite otro enlace.`);
  await c.auth.signOut();
}
