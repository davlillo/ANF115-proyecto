import "server-only";
import { crearClienteFinanzas } from "@/supabase/finanzas.server";
import { PERMISOS_POR_ROL, type Permiso } from "@/config/permisos";
import { ErrorDominio } from "@/lib/errores";

/**
 * Resuelve el perfil operativo y aplica las guardas de la operacion.
 *
 * `administrador` restringe a administracion; `permiso` exige un permiso
 * concreto de la matriz del rol. Ambos se comprueban en el servidor: la
 * navegacion solo oculta enlaces, no autoriza.
 */
export async function requerirPerfilOperativo(administrador = false, permiso?: Permiso) {
  const cliente = await crearClienteFinanzas();
  const { data: { user }, error } = await cliente.auth.getUser();
  if (error || !user) throw new ErrorDominio("NO_AUTENTICADO");
  const { data: perfil, error: perfilError } = await cliente.from("perfiles")
    .select("usuario_id,nombre,rol,activo,actualizado_en").eq("usuario_id", user.id).maybeSingle();
  if (perfilError) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "No se pudo consultar el perfil. Verifique Supabase local y las migraciones.");
  if (!perfil?.activo) throw new ErrorDominio("PERMISO_DENEGADO");
  if (administrador && perfil.rol !== "administrador") throw new ErrorDominio("PERMISO_DENEGADO");
  if (permiso && !PERMISOS_POR_ROL[perfil.rol].includes(permiso)) throw new ErrorDominio("PERMISO_DENEGADO");
  return { cliente, perfil, user };
}
