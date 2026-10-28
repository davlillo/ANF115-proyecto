import "server-only";
import { z } from "zod";
import { crearClienteFinanzas } from "@/supabase/finanzas.server";
import { crearClienteAdmin } from "@/supabase/admin";
import type { FinanzasDatabase } from "@/supabase/finanzas.types";
import { ErrorDominio } from "@/lib/errores";
import { aImporteCanonico } from "@/lib/decimal";
import type { FiltroFinanciero, TipoMovimiento } from "@/types/finanzas";

const decimal = z.string().regex(/^-?\d+(?:\.\d{1,2})?$/).transform(aImporteCanonico);
const resumen = z.object({ ingresos: decimal, gastos: decimal, resultado: decimal,
  porcentaje_gastos: decimal.nullable(), cantidad: z.number().int().nonnegative() });
const reporteSchema = z.object({
  resumen,
  periodos: z.array(resumen.extend({ periodo: z.string() })),
  categorias: z.array(z.object({ categoria: z.string(), monto: decimal })),
});

export function comprobarError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === "40001") throw new ErrorDominio("VERSION_OBSOLETA");
  if (error.code === "23505") throw new ErrorDominio("DUPLICADO", "El código o la solicitud ya existe. Revise el registro antes de repetir.");
  if (error.code === "42501") throw new ErrorDominio("PERMISO_DENEGADO");
  if (error.code === "23514" || error.code === "22023")
    throw new ErrorDominio("VALIDACION_ENTRADA", "La operación no cumple las reglas: revise monto, categoría, estado o último administrador.");
  throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE");
}

export async function leerCategorias(tipo?: TipoMovimiento, activo?: boolean) {
  const c = await crearClienteFinanzas();
  let consulta = c.from("categorias").select("id,codigo,nombre,tipo,descripcion,activo,actualizado_en");
  if (tipo) consulta = consulta.eq("tipo", tipo);
  if (activo !== undefined) consulta = consulta.eq("activo", activo);
  const { data, error } = await consulta.order("codigo");
  comprobarError(error);
  return data ?? [];
}

export async function leerMovimientos(f: FiltroFinanciero, pagina: number) {
  const c = await crearClienteFinanzas();
  let q = c.from("v_movimientos").select("*", { count: "exact" })
    .gte("fecha", f.desde).lte("fecha", f.hasta);
  if (f.tipo) q = q.eq("tipo", f.tipo);
  if (f.categoria) q = q.eq("categoria_id", f.categoria);
  if (f.estado) q = q.eq("estado", f.estado);
  const { data, error, count } = await q.order("fecha", { ascending: false }).order("id", { ascending: false })
    .range((pagina - 1) * 50, pagina * 50 - 1);
  comprobarError(error);
  return { movimientos: (data ?? []).map((m) => ({ ...m, monto: aImporteCanonico(m.monto) })), total: count ?? 0 };
}

export async function leerReporte(f: FiltroFinanciero) {
  const c = await crearClienteFinanzas();
  const { data, error } = await c.rpc("anf_reporte", {
    p_desde: f.desde, p_hasta: f.hasta, p_categoria: f.categoria ?? null,
    p_tipo: f.tipo ?? null, p_granularidad: f.granularidad,
  });
  comprobarError(error);
  const validado = reporteSchema.safeParse(data);
  if (!validado.success) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "El contrato del reporte no coincide con la migración local.");
  return validado.data;
}

export async function leerPerfiles(pagina: number, filtros?: {
  buscar?: string;
  rol?: "administrador" | "empleado";
  activo?: boolean;
}) {
  const c = await crearClienteFinanzas();
  const { data, error } = await c.from("perfiles").select("usuario_id,nombre,rol,activo,actualizado_en")
    .order("nombre").order("usuario_id");
  comprobarError(error);
  const { data: identidades, error: authError } = await crearClienteAdmin().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "No se pudieron consultar las identidades de usuarios.");
  const porId = new Map(identidades.users.map((usuario) => [usuario.id, usuario]));
  const buscar = filtros?.buscar?.toLocaleLowerCase("es") ?? "";
  const perfiles = (data ?? []).map((perfil) => {
    const identidad = porId.get(perfil.usuario_id);
    return { ...perfil, correo: identidad?.email ?? "Correo no disponible", creado_en: identidad?.created_at ?? perfil.actualizado_en };
  }).filter((perfil) =>
    (!filtros?.rol || perfil.rol === filtros.rol)
    && (filtros?.activo === undefined || perfil.activo === filtros.activo)
    && (!buscar || `${perfil.nombre} ${perfil.correo} ${perfil.usuario_id}`.toLocaleLowerCase("es").includes(buscar)));
  return { perfiles: perfiles.slice((pagina - 1) * 50, pagina * 50), total: perfiles.length };
}

export async function leerBitacora(pagina: number) {
  const c = await crearClienteFinanzas();
  const { data, error, count } = await c.from("bitacora")
    .select("id,actor_id,fecha_hora,accion,entidad,registro_id,motivo,antes,despues", { count: "exact" })
    .order("fecha_hora", { ascending: false }).order("id").range((pagina - 1) * 50, pagina * 50 - 1);
  comprobarError(error);
  const filas = data ?? [];
  // Resuelve el nombre y rol de cada actor; el administrador puede leer todos los perfiles.
  const ids = [...new Set(filas.map((e) => e.actor_id).filter((id): id is string => !!id))];
  const actores = new Map<string, { nombre: string; rol: string }>();
  if (ids.length > 0) {
    const r = await c.from("perfiles").select("usuario_id,nombre,rol").in("usuario_id", ids);
    comprobarError(r.error);
    for (const p of r.data ?? []) actores.set(p.usuario_id, { nombre: p.nombre, rol: p.rol });
  }
  const eventos = filas.map((e) => ({
    ...e,
    actor_nombre: e.actor_id ? actores.get(e.actor_id)?.nombre ?? null : null,
    actor_rol: e.actor_id ? actores.get(e.actor_id)?.rol ?? null : null,
  }));
  return { eventos, total: count ?? 0 };
}

export async function leerActividadUsuarios(ids: string[]) {
  if (ids.length === 0) return [];
  const c = await crearClienteFinanzas();
  const { data, error } = await c.from("bitacora")
    .select("id,actor_id,fecha_hora,accion,entidad,registro_id,motivo,antes,despues")
    .in("actor_id", ids).order("fecha_hora", { ascending: false }).limit(200);
  comprobarError(error);
  const { data: actores, error: actoresError } = await c.from("perfiles")
    .select("usuario_id,nombre").in("usuario_id", ids);
  comprobarError(actoresError);
  const nombres = new Map((actores ?? []).map((actor) => [actor.usuario_id, actor.nombre]));
  return (data ?? []).map((evento) => ({
    ...evento,
    actor_nombre: evento.actor_id ? (nombres.get(evento.actor_id) ?? "Usuario no disponible") : null,
  }));
}

type Funciones = FinanzasDatabase["public"]["Functions"];

export async function persistirMovimiento(args: Funciones["anf_guardar_movimiento"]["Args"]) {
  const c = await crearClienteFinanzas();
  const { data, error } = await c.rpc("anf_guardar_movimiento", args);
  comprobarError(error); return data;
}

export async function persistirAnulacion(args: Funciones["anf_anular_movimiento"]["Args"]) {
  const c = await crearClienteFinanzas();
  const { data, error } = await c.rpc("anf_anular_movimiento", args);
  comprobarError(error); return data;
}

export async function persistirCategoria(args: Funciones["anf_guardar_categoria"]["Args"]) {
  const c = await crearClienteFinanzas();
  const { data, error } = await c.rpc("anf_guardar_categoria", args);
  comprobarError(error); return data;
}

export async function persistirUsuario(v: {
  id?: string; versionEsperada?: string; nombre: string; correo?: string;
  contrasena?: string; rol: string; activo: boolean;
}) {
  const c = await crearClienteFinanzas();
  let id = v.id;
  if (!id) {
    // Only Auth identity provisioning uses the privileged key, never financial DML.
    const { data, error } = await crearClienteAdmin().auth.admin.createUser({
      email: v.correo, password: v.contrasena, email_confirm: true, user_metadata: { nombre: v.nombre },
    });
    if (error || !data.user) throw new ErrorDominio("DUPLICADO", "No se pudo crear la identidad. Compruebe el correo antes de reintentar.");
    id = data.user.id;
  }
  const { data: perfil, error: lecturaError } = await c.from("perfiles")
    .select("usuario_id,nombre,rol,activo,actualizado_en").eq("usuario_id", id).single();
  if (lecturaError || !perfil) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "La identidad existe, pero su perfil quedó pendiente. No repita el alta; revise Usuarios.");
  const { data, error } = await c.rpc("anf_guardar_perfil", {
    p_id: id, p_version: v.versionEsperada ?? perfil.actualizado_en,
    p_nombre: v.nombre, p_rol: v.rol, p_activo: v.activo,
  });
  if (error && !v.id) throw new ErrorDominio("INTEGRACION_NO_DISPONIBLE", "La identidad fue creada como empleado inactivo. Complete su activación desde Usuarios.");
  comprobarError(error); return data;
}
