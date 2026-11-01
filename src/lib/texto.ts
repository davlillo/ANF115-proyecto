/**
 * Normaliza una busqueda humana para filtros SQL.
 *
 * Conserva letras, numeros, espacios, puntos y guiones. Elimina caracteres
 * que PostgREST interpreta como sintaxis de filtro.
 */
export function normalizarBusqueda(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

/** Iniciales (maximo dos) de un nombre para avatares. */
export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return `${primera}${ultima}`.toUpperCase();
}
