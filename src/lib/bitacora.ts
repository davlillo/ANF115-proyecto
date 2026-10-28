/** Presentación de eventos de bitácora: etiquetas legibles sobre los valores de la base. */
const ACCIONES: Record<string, { etiqueta: string; tono: "success" | "info" | "warning" | "neutral" }> = {
  INSERT: { etiqueta: "Creación", tono: "success" },
  UPDATE: { etiqueta: "Modificación", tono: "info" },
  ANULAR: { etiqueta: "Anulación", tono: "warning" },
  MIGRACION: { etiqueta: "Migración", tono: "neutral" },
};

const ENTIDADES: Record<string, string> = {
  perfiles: "Usuario",
  categorias: "Categoría",
  ingresos: "Ingreso",
  gastos: "Gasto",
  sistema: "Sistema",
};

const ROLES: Record<string, string> = { administrador: "Administrador", empleado: "Empleado" };

export function describirAccion(accion: string) {
  return ACCIONES[accion] ?? { etiqueta: accion, tono: "neutral" as const };
}

export function describirEntidad(entidad: string) {
  return ENTIDADES[entidad] ?? entidad;
}

export function describirActor(nombre?: string | null, rol?: string | null, actorId?: string | null) {
  if (!actorId) return { nombre: "Sistema", detalle: "Proceso automático o mantenimiento" };
  return { nombre: nombre ?? "Usuario eliminado", detalle: rol ? (ROLES[rol] ?? rol) : `ID ${actorId.slice(0, 8)}…` };
}

/** Fecha y hora local de El Salvador, p. ej. «26/10/2026, 6:08:43 p. m.». */
export function formatearInstante(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  }).format(d);
}
/* ---------- Detalle legible del cambio ---------- */
const CAMPOS: Record<string, string> = {
  nombre: "Nombre", rol: "Rol", activo: "Estado", codigo: "Código", tipo: "Tipo",
  descripcion: "Descripción", fecha: "Fecha", concepto: "Concepto", monto: "Monto",
  referencia: "Referencia", estado: "Estado", categoria_id: "Categoría",
};
// Campos técnicos que no aportan al lector (el motivo se muestra aparte).
const IGNORADOS = new Set([
  "id", "usuario_id", "creado_en", "actualizado_en", "creado_por", "actualizado_por",
  "revision", "solicitud_id", "anulado_por", "anulado_en", "motivo_anulacion",
]);
const SUJETO: Record<string, string> = { perfiles: "nombre", categorias: "nombre", ingresos: "concepto", gastos: "concepto" };

export type FilaCambio = { campo: string; antes: string; despues: string };
export type ResumenCambio = { titulo: string; sujeto: string | null; filas: FilaCambio[]; mostrarAntes: boolean };

function registro(valor: unknown): Record<string, unknown> | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
}

function formatearValor(campo: string, valor: unknown, entidad: string): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (campo === "activo") return valor ? (entidad === "categorias" ? "Activa" : "Activo") : (entidad === "categorias" ? "Inactiva" : "Inactivo");
  if (campo === "rol") return ROLES[String(valor)] ?? String(valor);
  if (campo === "tipo") return valor === "ingreso" ? "Ingreso" : valor === "gasto" ? "Gasto" : String(valor);
  if (campo === "estado") return valor === "vigente" ? "Vigente" : valor === "anulado" ? "Anulado" : String(valor);
  if (campo === "monto") return `$${String(valor)}`;
  if (campo === "categoria_id") return "Otra categoría";
  return String(valor);
}

export function resumirCambio(accion: string, entidad: string, antes: unknown, despues: unknown): ResumenCambio {
  const a = registro(antes);
  const d = registro(despues);
  const sujeto = d && SUJETO[entidad] && d[SUJETO[entidad]] ? String(d[SUJETO[entidad]]) : null;
  const nombreEntidad = describirEntidad(entidad).toLowerCase();

  if (accion === "MIGRACION" || !d) return { titulo: "Cambio del sistema", sujeto: null, filas: [], mostrarAntes: false };

  if (accion === "INSERT") {
    const filas = Object.keys(CAMPOS).filter((k) => k in d && d[k] !== null && d[k] !== "")
      .map((k) => ({ campo: CAMPOS[k], antes: "", despues: formatearValor(k, d[k], entidad) }));
    return { titulo: `Se creó ${entidad === "perfiles" ? "el usuario" : `el registro de ${nombreEntidad}`}`, sujeto, filas, mostrarAntes: false };
  }

  const cambiados = Object.keys(d).filter((k) => !IGNORADOS.has(k) && CAMPOS[k] && JSON.stringify(a?.[k]) !== JSON.stringify(d[k]));
  const filas = cambiados.map((k) => ({
    campo: CAMPOS[k], antes: formatearValor(k, a?.[k], entidad), despues: formatearValor(k, d[k], entidad),
  }));

  let titulo = accion === "ANULAR" ? `Se anuló el registro de ${nombreEntidad}` : `Se modificó ${entidad === "perfiles" ? "el usuario" : `el registro de ${nombreEntidad}`}`;
  if (accion === "UPDATE" && cambiados.length === 1 && cambiados[0] === "activo") {
    titulo = `${d.activo ? "Se activó" : "Se desactivó"} ${entidad === "perfiles" ? "el usuario" : "la categoría"}`;
  }
  return { titulo, sujeto, filas, mostrarAntes: true };
}