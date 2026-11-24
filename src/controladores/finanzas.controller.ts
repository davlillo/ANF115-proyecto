import "server-only";
import { z } from "zod";
import { requerirPerfilOperativo } from "@/auth/perfil-operativo";
import { leerCategorias, leerMovimientos, leerReporte, leerPerfiles, leerBitacora, leerUsuario,
  persistirMovimiento, persistirAnulacion, persistirCategoria, persistirUsuario, persistirEstadoUsuario } from "@/repositorios/finanzas.repository";
import { filtroFinancieroSchema, movimientoSchema, anulacionSchema, categoriaSchema, usuarioSchema, estadoUsuarioSchema } from "@/schemas/finanzas.schema";
import { anchoComparativo } from "@/servicios/finanzas/resumen";
import { prepararGraficos } from "@/servicios/finanzas/graficos";
import { Decimal } from "@/lib/decimal";
import { desdeError, generarRequestId, ok, fallo } from "@/lib/resultado";
import { ErrorDominio } from "@/lib/errores";
import { hoyEnElSalvador } from "@/lib/fechas";
import type { Permiso } from "@/config/permisos";
import type { TipoMovimiento } from "@/types/finanzas";

type Query = Record<string, string | string[] | undefined>;
function texto(q: Query, k: string) { return typeof q[k] === "string" ? q[k] : undefined; }

export async function consultarFinanzas(q: Query, tipo?: "ingreso" | "gasto", permiso?: Permiso) {
  const requestId = generarRequestId();
  try {
    const { perfil } = await requerirPerfilOperativo(false, permiso);
    const hoy = hoyEnElSalvador();
    const filtro = filtroFinancieroSchema.parse({ desde: texto(q, "desde") ?? `${hoy.slice(0, 7)}-01`,
      hasta: texto(q, "hasta") ?? hoy, categoria: texto(q, "categoria") || undefined,
      tipo: tipo ?? (texto(q, "tipo") || undefined), estado: texto(q, "estado") || undefined,
      granularidad: texto(q, "granularidad") ?? "mes" });
    const pagina = z.coerce.number().int().min(1).max(100000).parse(texto(q, "pagina") ?? "1");
    const [categorias, listado, reporte] = await Promise.all([leerCategorias(), leerMovimientos(filtro, pagina), leerReporte(filtro)]);
    const maximo = Decimal.max(reporte.resumen.ingresos, reporte.resumen.gastos).toString();
    return ok({ perfil, filtro, pagina, fechaSugerida: hoy, ...listado, resumen: reporte.resumen, periodos: reporte.periodos, categorias,
      barras: { ingresos: anchoComparativo(reporte.resumen.ingresos, maximo), gastos: anchoComparativo(reporte.resumen.gastos, maximo) },
      distribucion: reporte.categorias.map((c) => ({ ...c, ancho: anchoComparativo(c.monto, reporte.resumen.gastos) })),
      graficos: prepararGraficos(reporte.periodos),
    }, requestId);
  } catch (e) {
    if (e instanceof z.ZodError) return fallo("VALIDACION_ENTRADA", requestId, { mensaje: "Revise fechas, categoría, tipo, estado y página. El rango máximo es de 3660 días." });
    return desdeError(e, requestId);
  }
}

export async function consultarAdministracion(
  modulo: "usuarios" | "categorias" | "bitacora" | "perfil",
  pagina = 1,
  tipoCategoria?: TipoMovimiento,
  estadoCategoria?: "activa" | "inactiva",
  filtrosUsuarios?: { buscar?: string; rol?: "administrador" | "empleado"; activo?: boolean },
  vistaSeguridad: "usuarios" | "bitacora" = "usuarios",
) {
  const requestId = generarRequestId();
  try {
    const { perfil, user } = await requerirPerfilOperativo(modulo === "usuarios" || modulo === "bitacora");
    const activoCategoria = modulo === "categorias"
      ? (perfil.rol === "administrador"
          ? (estadoCategoria ? estadoCategoria === "activa" : undefined)
          : true)
      : undefined;
    const consultarUsuarios = modulo === "usuarios" || (modulo === "bitacora" && vistaSeguridad === "usuarios");
    const [categorias, usuarios, bitacora] = await Promise.all([
      modulo === "categorias"
        ? leerCategorias(tipoCategoria, activoCategoria)
        : Promise.resolve([]),
      consultarUsuarios ? leerPerfiles(pagina, filtrosUsuarios) : Promise.resolve({ perfiles: [], total: 0 }),
      modulo === "bitacora" && vistaSeguridad === "bitacora" ? leerBitacora(pagina) : Promise.resolve({ eventos: [], total: 0 }),
    ]);
    return ok({ perfil, correoPerfil: modulo === "perfil" ? (user.email ?? "") : undefined,
      categorias, perfiles: usuarios.perfiles,
      eventos: bitacora.eventos,
      tipoCategoria, estadoCategoria, filtrosUsuarios, vistaSeguridad,
      total: consultarUsuarios ? usuarios.total : bitacora.total }, requestId);
  } catch (e) { return desdeError(e, requestId); }
}

export async function consultarUsuario(id: string, actividad = false, pagina = 1) {
  const requestId = generarRequestId();
  try {
    await requerirPerfilOperativo(true);
    if (!z.uuid().safeParse(id).success) return fallo("RECURSO_NO_ENCONTRADO", requestId);
    const usuario = await leerUsuario(id);
    const bitacora = actividad ? await leerBitacora(pagina, id) : { eventos: [], total: 0 };
    return ok({ usuario, ...bitacora }, requestId);
  } catch (e) { return desdeError(e, requestId); }
}

export async function ejecutarOperacion(operacion: string, input: Record<string, unknown>) {
  const requestId = generarRequestId();
  try {
    const admin = ["categoria", "usuario", "usuario_estado"].includes(operacion);
    await requerirPerfilOperativo(admin);
    if (operacion === "movimiento") {
      const v = movimientoSchema.parse(input);
      const id = await persistirMovimiento({
        p_tipo: v.tipo, p_id: v.id ?? null, p_revision: v.revision ?? null, p_solicitud: v.solicitud_id,
        p_fecha: v.fecha, p_concepto: v.concepto, p_monto: v.monto, p_categoria: v.categoria_id, p_referencia: v.referencia,
      }); return ok({ id }, requestId);
    }
    if (operacion === "anular") {
      const v = anulacionSchema.parse(input);
      const id = await persistirAnulacion({
        p_tipo: v.tipo, p_id: v.id, p_revision: v.revision, p_motivo: v.motivo,
      }); return ok({ id }, requestId);
    }
    if (operacion === "categoria") {
      const v = categoriaSchema.parse(input);
      const id = await persistirCategoria({
        p_id: v.id ?? null, p_version: v.versionEsperada ?? null, p_codigo: v.codigo, p_nombre: v.nombre,
        p_tipo: v.tipo, p_descripcion: v.descripcion, p_activo: v.activo,
      }); return ok({ id }, requestId);
    }
    if (operacion === "usuario") {
      const v = usuarioSchema.parse(input);
      const id = await persistirUsuario(v);
      return ok({ id }, requestId);
    }
    if (operacion === "usuario_estado") {
      const v = estadoUsuarioSchema.parse(input);
      const id = await persistirEstadoUsuario(v);
      return ok({ id }, requestId);
    }
    throw new ErrorDominio("VALIDACION_ENTRADA");
  } catch (e) {
    if (e instanceof z.ZodError) return fallo("VALIDACION_ENTRADA", requestId, {
      mensaje: "Revise los campos indicados.", campos: e.issues.map((i) => ({ ruta: i.path.join("."), mensaje: i.message, codigo: i.code })),
    });
    return desdeError(e, requestId);
  }
}
