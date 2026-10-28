export type TipoMovimiento = "ingreso" | "gasto";
export type RolOperativo = "administrador" | "empleado";

export type Perfil = {
  usuario_id: string;
  nombre: string;
  rol: RolOperativo;
  activo: boolean;
  actualizado_en: string;
};

export type PerfilAdministrado = Perfil & {
  correo: string;
  creado_en: string;
};

export type Categoria = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoMovimiento;
  descripcion: string;
  activo: boolean;
  actualizado_en: string;
};

export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  concepto: string;
  monto: string;
  categoria_id: string;
  categoria: string;
  referencia: string | null;
  estado: "vigente" | "anulado";
  creado_por: string;
  revision: number;
  motivo_anulacion: string | null;
  anulado_por: string | null;
  anulado_en: string | null;
  anulador: string | null;
};

export type FiltroFinanciero = {
  desde: string;
  hasta: string;
  categoria?: string;
  tipo?: TipoMovimiento;
  estado?: "vigente" | "anulado";
  granularidad: "dia" | "mes" | "anio";
};

export type ResumenFinanciero = {
  ingresos: string;
  gastos: string;
  resultado: string;
  porcentaje_gastos: string | null;
  cantidad: number;
};

export type PeriodoFinanciero = ResumenFinanciero & { periodo: string };
export type DistribucionCategoria = { categoria: string; monto: string; ancho: string };
export type EventoBitacora = {
  id: string;
  actor_id: string | null;
  fecha_hora: string;
  accion: string;
  entidad: string;
  registro_id: string | null;
  motivo: string | null;
  antes: unknown;
  despues: unknown;
  actor_nombre?: string | null;   
  actor_rol?: string | null; 
};

export type EventoBitacoraVista = EventoBitacora & {
  actor_nombre: string | null;
};

export type EstadoOperacion = {
  ok: boolean;
  mensaje: string;
  campos?: Record<string, string>;
};

export type VistaFinanciera = {
  fechaSugerida: string;
  perfil: Perfil;
  filtro: FiltroFinanciero;
  pagina: number;
  categorias: Categoria[];
  movimientos: Movimiento[];
  total: number;
  resumen: ResumenFinanciero;
  periodos: PeriodoFinanciero[];
  barras: { ingresos: string; gastos: string };
  distribucion: DistribucionCategoria[];
};

export type CampoOperacion = {
  nombre: string;
  etiqueta: string;
  tipo?: "text" | "date" | "email" | "password" | "select" | "checkbox" | "textarea";
  valor?: string;
  requerido?: boolean;
  opciones?: { valor: string; etiqueta: string }[];
  maxLength?: number;
  placeholder?: string;
};

export type AccionOperacion = (estado: EstadoOperacion, datos: FormData) => Promise<EstadoOperacion>;
