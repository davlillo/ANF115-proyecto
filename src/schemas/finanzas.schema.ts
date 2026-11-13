import { z } from "zod";
import { Decimal } from "@/lib/decimal";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";

export const contrasenaSchema = z.string().min(LONGITUD_MINIMA_CONTRASENA).max(128);

export const fechaFinancieraSchema = z.iso.date();
export const montoFinancieroSchema = z.string()
  .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, "Use un importe positivo, sin separadores y con hasta dos decimales.")
  .refine((valor) => /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(valor) && new Decimal(valor).gt(0), "El importe debe ser mayor que cero.");

export const filtroFinancieroSchema = z.object({
  desde: fechaFinancieraSchema,
  hasta: fechaFinancieraSchema,
  categoria: z.uuid().optional(),
  tipo: z.enum(["ingreso", "gasto"]).optional(),
  estado: z.enum(["vigente", "anulado"]).optional(),
  granularidad: z.enum(["dia", "mes", "anio"]).default("mes"),
}).refine((v) => v.desde <= v.hasta, { message: "La fecha inicial no puede ser posterior a la final.", path: ["hasta"] })
  .refine((v) => (Date.parse(v.hasta) - Date.parse(v.desde)) / 86400000 <= 3660,
    { message: "El rango máximo es de 3660 días.", path: ["hasta"] });

export const movimientoSchema = z.object({
  tipo: z.enum(["ingreso", "gasto"]),
  id: z.uuid().optional(),
  revision: z.coerce.number().int().positive().optional(),
  solicitud_id: z.uuid(),
  fecha: fechaFinancieraSchema,
  concepto: z.string().trim().min(2).max(250),
  monto: montoFinancieroSchema,
  categoria_id: z.uuid(),
  referencia: z.string().trim().max(120).default(""),
}).refine((v) => !v.id || v.revision !== undefined, { path: ["revision"], message: "Falta la revisión del registro." });

export const anulacionSchema = z.object({
  tipo: z.enum(["ingreso", "gasto"]),
  id: z.uuid(),
  revision: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(5).max(500),
});

export const categoriaSchema = z.object({
  id: z.uuid().optional(),
  versionEsperada: z.string().optional(),
  codigo: z.string().trim().regex(/^[IG]\d{2,4}$/),
  nombre: z.string().trim().min(2).max(100),
  tipo: z.enum(["ingreso", "gasto"]),
  descripcion: z.string().trim().max(500),
  activo: z.boolean(),
}).refine((v) => !v.id || !!v.versionEsperada, { path: ["versionEsperada"], message: "Falta la versión de la categoría." })
  .refine((v) => v.codigo.startsWith(v.tipo === "ingreso" ? "I" : "G"),
  { path: ["codigo"], message: "El código debe corresponder al tipo (I o G)." });

export const usuarioSchema = z.object({
  id: z.uuid().optional(),
  versionEsperada: z.string().optional(),
  nombre: z.string().trim().min(2).max(120),
  correo: z.email().optional(),
  contrasena: contrasenaSchema.optional(),
  rol: z.enum(["administrador", "empleado"]),
}).refine((v) => !!v.id || (!!v.correo && !!v.contrasena), { message: `Indique correo y contraseña de al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.` })
  .refine((v) => !v.id || !!v.versionEsperada, { path: ["versionEsperada"], message: "Falta la versión del perfil." });

export const estadoUsuarioSchema = z.object({
  id: z.uuid(),
  versionEsperada: z.string().min(1),
  activo: z.boolean(),
});
