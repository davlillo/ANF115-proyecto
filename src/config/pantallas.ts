import type { Permiso } from "./permisos";

/**
 * Catalogo de pantallas del mapa funcional.
 *
 * Cada pagina del cascaron consume su entrada para no duplicar titulos,
 * descripciones ni fase objetivo. No contiene datos financieros.
 *
 * Fuente: docs/tecnico/09_PANTALLAS_Y_ATOMIC_DESIGN.md
 */
export type Fase = "01" | "02" | "03" | "04" | "05";

export type Pantalla = {
  titulo: string;
  descripcion: string;
  ruta: string;
  acceso: string;
  permiso: Permiso | null;
  fase: Fase;
  notaFase?: string;
};

export const pantallas = {
  dashboard: {
    titulo: "Dashboard",
    descripcion:
      "Contexto de empresa, corte, origen de datos y accesos a los modulos.",
    ruta: "/dashboard",
    acceso: "finanzas.leer",
    permiso: "finanzas.leer",
    fase: "01",
    notaFase: "Datos financieros desde la fase 03",
  },
  usuarios: {
    lista: {
      titulo: "Usuarios y roles",
      descripcion:
        "Registro, búsqueda y edición de información y roles de usuarios.",
      ruta: "/usuarios",
      acceso: "usuarios.gestionar",
      permiso: "usuarios.gestionar",
      fase: "01",
    },
    nuevo: {
      titulo: "Nuevo usuario",
      descripcion:
        "Alta de identidad y membresia con manejo explicito de fallos parciales.",
      ruta: "/usuarios/nuevo",
      acceso: "usuarios.gestionar",
      permiso: "usuarios.gestionar",
      fase: "01",
    },
    detalle: {
      titulo: "Gestionar usuario",
      descripcion:
        "Edición de nombre y rol. El estado se administra en Seguridad y bitácora.",
      ruta: "/usuarios/[id]",
      acceso: "usuarios.gestionar",
      permiso: "usuarios.gestionar",
      fase: "01",
    },
    permisos: {
      titulo: "Matriz de permisos",
      descripcion:
        "Roles, permisos efectivos y alcance de cada operacion funcional.",
      ruta: "/usuarios/permisos",
      acceso: "usuarios.gestionar",
      permiso: "usuarios.gestionar",
      fase: "01",
    },
  },
  catalogo: {
    lista: {
      titulo: "Catalogo de cuentas",
      descripcion:
        "Arbol de cuentas, busqueda, naturaleza, rubro y vigencia.",
      ruta: "/catalogo",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "01",
    },
    nueva: {
      titulo: "Nueva cuenta",
      descripcion:
        "Alta de cuenta con clasificacion, jerarquia y vigencia controladas.",
      ruta: "/catalogo/nueva",
      acceso: "catalogo.publicar",
      permiso: "catalogo.publicar",
      fase: "01",
    },
    detalle: {
      titulo: "Detalle de cuenta",
      descripcion:
        "Cuenta, rubro, naturaleza y referencias del catalogo publicado.",
      ruta: "/catalogo/[id]",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "01",
    },
  },
  periodos: {
    lista: {
      titulo: "Periodos contables",
      descripcion:
        "Calendario mensual, disponibilidad y estado abierto o cerrado.",
      ruta: "/periodos",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "01",
    },
    cierre: {
      titulo: "Cierre de periodo",
      descripcion:
        "Revision previa, cierre, snapshot y reapertura con motivo.",
      ruta: "/periodos/[id]/cierre",
      acceso: "periodos.cerrar / periodos.reabrir",
      permiso: "periodos.cerrar",
      fase: "05",
    },
  },
  importaciones: {
    lista: {
      titulo: "Importaciones",
      descripcion:
        "Carga de archivos, historial de lotes y estado de validacion.",
      ruta: "/importaciones",
      acceso: "finanzas.leer; preparar con importaciones.preparar",
      permiso: "finanzas.leer",
      fase: "02",
    },
    detalle: {
      titulo: "Detalle de importacion",
      descripcion:
        "Filas, errores, totales y confirmacion del lote en una transaccion.",
      ruta: "/importaciones/[id]",
      acceso: "finanzas.leer; acciones con importaciones.preparar",
      permiso: "finanzas.leer",
      fase: "02",
    },
  },
  diario: {
    lista: {
      titulo: "Libro diario",
      descripcion:
        "Asientos por fecha, cuenta y estado, con procedencia y paginacion.",
      ruta: "/diario",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "02",
    },
    nuevo: {
      titulo: "Nuevo asiento",
      descripcion:
        "Borrador manual con lineas, validacion y partida doble.",
      ruta: "/diario/nuevo",
      acceso: "asientos.preparar",
      permiso: "asientos.preparar",
      fase: "02",
    },
    detalle: {
      titulo: "Detalle de asiento",
      descripcion:
        "Lineas, validacion, aprobacion, reversion y auditoria del asiento.",
      ruta: "/diario/[id]",
      acceso: "finanzas.leer; acciones segun permiso",
      permiso: "finanzas.leer",
      fase: "02",
    },
  },
  estados: {
    indice: {
      titulo: "Estados historicos",
      descripcion:
        "Seleccion de informe y base temporal coherente con la consulta.",
      ruta: "/estados",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
    comprobacion: {
      titulo: "Comprobacion de sumas y saldos",
      descripcion:
        "Debitos, creditos y saldos por cuenta con deteccion de descuadres.",
      ruta: "/estados/comprobacion",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
    resultados: {
      titulo: "Estado de resultados",
      descripcion:
        "Ingresos, costos, gastos y resultado del periodo consultado.",
      ruta: "/estados/resultados",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
    balance: {
      titulo: "Balance general",
      descripcion:
        "Activos, pasivos, patrimonio y verificacion Activo = Pasivo + Patrimonio.",
      ruta: "/estados/balance",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
    patrimonio: {
      titulo: "Cambios en el patrimonio",
      descripcion:
        "Saldo inicial, movimientos y saldo final del patrimonio.",
      ruta: "/estados/patrimonio",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
  },
  presupuestos: {
    lista: {
      titulo: "Presupuestos",
      descripcion:
        "Versiones por ejercicio, estado y creacion de planes.",
      ruta: "/presupuestos",
      acceso: "finanzas.leer; crear con presupuestos.preparar",
      permiso: "finanzas.leer",
      fase: "04",
    },
    detalle: {
      titulo: "Detalle de presupuesto",
      descripcion:
        "Lineas mensuales, efectivo, revision y aprobacion versionada.",
      ruta: "/presupuestos/[id]",
      acceso: "finanzas.leer; editar o aprobar segun permiso",
      permiso: "finanzas.leer",
      fase: "04",
    },
    comparativo: {
      titulo: "Comparativo real vs. presupuesto",
      descripcion:
        "Real, plan, desviaciones e interpretacion por rubro comparable.",
      ruta: "/presupuestos/[id]/comparativo",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "04",
    },
  },
  escenarios: {
    lista: {
      titulo: "Escenarios",
      descripcion:
        "Escenarios, metodos de pronostico y versiones ejecutadas.",
      ruta: "/escenarios",
      acceso: "finanzas.leer; crear con escenarios.ejecutar",
      permiso: "finanzas.leer",
      fase: "04",
    },
    detalle: {
      titulo: "Detalle de escenario",
      descripcion:
        "Metodo, supuestos, cobertura y pronostico preliminar.",
      ruta: "/escenarios/[id]",
      acceso: "finanzas.leer; cambios con escenarios.ejecutar",
      permiso: "finanzas.leer",
      fase: "04",
    },
    comparar: {
      titulo: "Comparar escenarios",
      descripcion:
        "Comparacion de versiones seleccionadas con supuestos explicitos.",
      ruta: "/escenarios/comparar",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "04",
    },
  },
  proyecciones: {
    lista: {
      titulo: "Proyecciones",
      descripcion:
        "Historial de ejecuciones integradas y su estado de publicacion.",
      ruta: "/proyecciones",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "05",
    },
    resultados: {
      titulo: "Resultados proyectados",
      descripcion:
        "Resultado futuro por mes con conciliaciones y advertencias.",
      ruta: "/proyecciones/[id]/resultados",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "05",
    },
    balance: {
      titulo: "Balance proyectado",
      descripcion:
        "Balance futuro y conciliaciones por mes.",
      ruta: "/proyecciones/[id]/balance",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "05",
    },
    patrimonio: {
      titulo: "Patrimonio proyectado",
      descripcion:
        "Evolucion futura del patrimonio y sus supuestos.",
      ruta: "/proyecciones/[id]/patrimonio",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "05",
    },
  },
  analisis: {
    indicadores: {
      titulo: "Indicadores financieros",
      descripcion:
        "Ratios, operandos, formulas, procedencia y calidad del dato.",
      ruta: "/analisis/indicadores",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
    comparativo: {
      titulo: "Analisis horizontal y vertical",
      descripcion:
        "Comparaciones entre periodos y composicion por rubro.",
      ruta: "/analisis/comparativo",
      acceso: "finanzas.leer",
      permiso: "finanzas.leer",
      fase: "03",
    },
  },
  reportes: {
    lista: {
      titulo: "Reportes",
      descripcion:
        "Generacion, historial y estado de archivos emitidos.",
      ruta: "/reportes",
      acceso: "finanzas.leer; generar con reportes.exportar",
      permiso: "finanzas.leer",
      fase: "05",
    },
    detalle: {
      titulo: "Detalle de reporte",
      descripcion:
        "Fuente, version, estado y descarga autorizada del archivo.",
      ruta: "/reportes/[id]",
      acceso: "finanzas.leer; descargar con reportes.exportar",
      permiso: "finanzas.leer",
      fase: "05",
    },
  },
  auditoria: {
    titulo: "Seguridad y bitácora",
    descripcion:
      "Acceso de usuarios, detalle de identidad, actividad y bitácora general.",
    ruta: "/auditoria",
    acceso: "auditoria.leer",
    permiso: "auditoria.leer",
    fase: "01",
  },
  seguridadUsuario: {
    titulo: "Seguridad de usuario",
    descripcion: "Detalle, actividad paginada y activación o desactivación del acceso.",
    ruta: "/auditoria/usuarios/[id]",
    acceso: "auditoria.leer",
    permiso: "auditoria.leer",
    fase: "01",
  },
  configuracion: {
    titulo: "Configuracion",
    descripcion:
      "Datos de empresa y politicas iniciales de calculo.",
    ruta: "/configuracion",
    acceso: "Administracion autorizada",
    permiso: null,
    fase: "01",
    notaFase: "Permiso definitivo por ratificar en Fase 01",
  },
} as const satisfies Record<string, Pantalla | Record<string, Pantalla>>;

export type PantallaPlana = Pantalla;
