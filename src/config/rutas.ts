/**
 * Fuente unica de URLs de la aplicacion.
 *
 * Las paginas, enlaces y redirecciones usan este mapa. Escapar un segmento no
 * demuestra que el recurso exista ni que pertenezca a la empresa autorizada.
 *
 * Fuente: docs/tecnico/06_DIRECTORIOS_Y_CONVENCIONES.md y 09_PANTALLAS.
 */
export const rutas = {
  inicio: "/",
  login: "/login",
  recuperarAcceso: "/recuperar-acceso",
  restablecerAcceso: "/restablecer-acceso",
  confirmarRecuperacion: "/auth/confirmar",
  dashboard: "/dashboard",
  ingresos: "/ingresos",
  gastos: "/gastos",
  categorias: "/categorias",
  usuarios: {
    propio: "/usuarios/perfil",
    lista: "/usuarios",
    nuevo: "/usuarios/nuevo",
    detalle: (id: string) => `/usuarios/${encodeURIComponent(id)}`,
    permisos: "/usuarios/permisos",
  },
  catalogo: {
    lista: "/catalogo",
    nueva: "/catalogo/nueva",
    detalle: (id: string) => `/catalogo/${encodeURIComponent(id)}`,
  },
  periodos: {
    lista: "/periodos",
    cierre: (id: string) => `/periodos/${encodeURIComponent(id)}/cierre`,
  },
  importaciones: {
    lista: "/importaciones",
    detalle: (id: string) => `/importaciones/${encodeURIComponent(id)}`,
  },
  diario: {
    lista: "/diario",
    nuevo: "/diario/nuevo",
    detalle: (id: string) => `/diario/${encodeURIComponent(id)}`,
  },
  estados: {
    indice: "/estados",
    comprobacion: "/estados/comprobacion",
    resultados: "/estados/resultados",
    balance: "/estados/balance",
    patrimonio: "/estados/patrimonio",
  },
  presupuestos: {
    lista: "/presupuestos",
    detalle: (id: string) => `/presupuestos/${encodeURIComponent(id)}`,
    comparativo: (id: string) =>
      `/presupuestos/${encodeURIComponent(id)}/comparativo`,
  },
  escenarios: {
    lista: "/escenarios",
    detalle: (id: string) => `/escenarios/${encodeURIComponent(id)}`,
    comparar: "/escenarios/comparar",
  },
  proyecciones: {
    lista: "/proyecciones",
    resultados: (id: string) =>
      `/proyecciones/${encodeURIComponent(id)}/resultados`,
    balance: (id: string) => `/proyecciones/${encodeURIComponent(id)}/balance`,
    patrimonio: (id: string) =>
      `/proyecciones/${encodeURIComponent(id)}/patrimonio`,
  },
  analisis: {
    indicadores: "/analisis/indicadores",
    comparativo: "/analisis/comparativo",
  },
  reportes: {
    lista: "/reportes",
    detalle: (id: string) => `/reportes/${encodeURIComponent(id)}`,
  },
  auditoria: "/auditoria",
  seguridadUsuario: (id: string) => `/auditoria/usuarios/${encodeURIComponent(id)}`,
  configuracion: "/configuracion",
  api: {
    health: "/api/health",
  },
} as const;

export type Rutas = typeof rutas;

/** Historical screens retained in source, withdrawn from the operational app. */
export const rutasRetiradas = [
  "/catalogo", "/periodos", "/importaciones", "/diario", "/estados", "/presupuestos",
  "/escenarios", "/proyecciones", "/analisis", "/configuracion",
] as const;
