import type { LucideIcon } from "lucide-react";
import { FileText, LayoutDashboard, ShieldCheck, Tags, TrendingDown, TrendingUp, Users } from "lucide-react";
import { PERMISOS, type Permiso } from "./permisos";
import { rutas } from "./rutas";

export type ItemNavegacion = { titulo: string; href: string; icono: LucideIcon; permiso: Permiso | null };
export type GrupoNavegacion = { id: string; titulo: string; items: readonly ItemNavegacion[] };

export const navegacionPrincipal: ItemNavegacion = {
  titulo: "Panel financiero", href: rutas.dashboard, icono: LayoutDashboard, permiso: PERMISOS.panelLeer,
};

export const navegacion: readonly GrupoNavegacion[] = [
  {
    id: "resumen", titulo: "Resumen", items: [
      navegacionPrincipal,
      { titulo: "Reportes", href: rutas.reportes.lista, icono: FileText, permiso: PERMISOS.panelLeer },
    ],
  },
  {
    id: "operacion", titulo: "Operación", items: [
      { titulo: "Ingresos", href: rutas.ingresos, icono: TrendingUp, permiso: PERMISOS.finanzasLeer },
      { titulo: "Gastos", href: rutas.gastos, icono: TrendingDown, permiso: PERMISOS.finanzasLeer },
      { titulo: "Categorías", href: rutas.categorias, icono: Tags, permiso: PERMISOS.finanzasLeer },
    ],
  },
  {
    id: "administracion", titulo: "Administración", items: [
      { titulo: "Usuarios", href: rutas.usuarios.lista, icono: Users, permiso: PERMISOS.usuariosGestionar },
      { titulo: "Seguridad y bitácora", href: rutas.auditoria, icono: ShieldCheck, permiso: PERMISOS.auditoriaLeer },
    ],
  },
];

export function filtrarNavegacion(permisos: readonly Permiso[]): readonly GrupoNavegacion[] {
  return navegacion.map((g) => ({ ...g, items: g.items.filter((i) => i.permiso === null || permisos.includes(i.permiso)) }))
    .filter((g) => g.items.length > 0);
}

/**
 * Destino inicial tras iniciar sesion.
 *
 * Sin `panel.leer` el empleado no tiene consolidados: entra directo a Ingresos,
 * su primera accion operativa, en lugar de a una pantalla sin permiso.
 */
export function rutaInicial(permisos: readonly Permiso[]): string {
  return permisos.includes(PERMISOS.panelLeer) ? rutas.dashboard : rutas.ingresos;
}
