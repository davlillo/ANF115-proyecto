import { CircleDollarSign, ReceiptText, Search, ShieldCheck, SlidersHorizontal, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { buttonVariants } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { StatusDot } from "@/components/atoms/status-dot";
import { CategoryStatusSwitch } from "@/components/molecules/category-status-switch";
import { EmptyState } from "@/components/molecules/empty-state";
import { AuditTable } from "@/components/organisms/audit-table";
import { CategoryDialog } from "@/components/organisms/categories/category-dialog";
import { UserActionsLink } from "@/components/organisms/users/user-actions-link";
import { OperationForm } from "./operation-form";
import { rutas } from "@/config/rutas";
import { LONGITUD_MINIMA_CONTRASENA } from "@/config/seguridad";
import { cn } from "@/lib/utils";
import type { AccionOperacion, Categoria, Perfil, PerfilAdministrado, EventoBitacoraVista, CampoOperacion } from "@/types/finanzas";

function fechaCorta(valor: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(valor));
}

function camposUsuario(): CampoOperacion[] {
  return [
    { nombre: "nombre", etiqueta: "Nombre", requerido: true, maxLength: 120 },
    { nombre: "correo", etiqueta: "Correo", tipo: "email", requerido: true },
    { nombre: "contrasena", etiqueta: `Contraseña (mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres)`, tipo: "password", requerido: true, minLength: LONGITUD_MINIMA_CONTRASENA, maxLength: 128 },
    { nombre: "rol", etiqueta: "Rol", tipo: "select", valor: "empleado", opciones: [{ valor: "empleado", etiqueta: "Empleado" }, { valor: "administrador", etiqueta: "Administrador" }] },
  ];
}

const ETIQUETA = "flex min-w-0 flex-col gap-1.5 text-xs text-texto-suave";
const RESUMEN_BOTON = `${buttonVariants()} sin-marcador ml-auto w-fit cursor-pointer`;

const TITULOS = { usuarios: "Usuarios", categorias: "Categorías", bitacora: "Seguridad y bitácora" } as const;

export function AdministrationWorkspace({ modulo, perfil, categorias, perfiles, eventos, accion, tipoCategoria, estadoCategoria, filtrosUsuarios, vistaSeguridad = "usuarios" }: {
  modulo: "usuarios" | "categorias" | "bitacora"; perfil: Perfil; categorias: Categoria[];
  perfiles: PerfilAdministrado[]; eventos: EventoBitacoraVista[]; accion: AccionOperacion;
  tipoCategoria?: "ingreso" | "gasto";
  estadoCategoria?: "activa" | "inactiva";
  filtrosUsuarios?: { buscar?: string; rol?: "administrador" | "empleado"; activo?: boolean };
  vistaSeguridad?: "usuarios" | "bitacora";
}) {
  const admin = perfil.rol === "administrador";
  const seguridad = modulo === "bitacora";
  return <div className="space-y-6">
    <h1 className="sr-only">{TITULOS[modulo]}</h1>
    {seguridad && <nav aria-label="Secciones de seguridad" className="flex flex-wrap gap-2">
      <Link href={rutas.auditoria} aria-current={vistaSeguridad === "usuarios" ? "page" : undefined}
        className={buttonVariants({ variant: vistaSeguridad === "usuarios" ? "primary" : "secondary" })}>Acceso de usuarios</Link>
      <Link href={`${rutas.auditoria}?vista=bitacora`} aria-current={vistaSeguridad === "bitacora" ? "page" : undefined}
        className={buttonVariants({ variant: vistaSeguridad === "bitacora" ? "primary" : "secondary" })}>Bitácora general</Link>
    </nav>}
    {seguridad && vistaSeguridad === "bitacora" ? <>
      <AuditTable eventos={eventos} />
    </> : <>
      {admin && modulo === "usuarios" && <details className="group">
        <summary className={RESUMEN_BOTON}>
          <UserPlus aria-hidden="true" />Registrar usuario
        </summary>
        <div className="mt-4 rounded-card border border-borde bg-superficie p-6"><h2 className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">Registrar usuario</h2>
          <OperationForm accion={accion} operacion="usuario" campos={camposUsuario()} texto="Crear cuenta" />
        </div>
      </details>}
      {(modulo === "usuarios" || seguridad) && <form method="get" className="flex flex-wrap items-end gap-4 rounded-card border border-borde bg-superficie px-5 py-4">
        <label className={`${ETIQUETA} w-full sm:min-w-[240px] sm:flex-1`}>Buscar
          <Input compacto icono={Search} name="buscar" defaultValue={filtrosUsuarios?.buscar ?? ""} placeholder="Nombre, correo o identificador" />
        </label>
        <label className={`${ETIQUETA} w-full sm:w-[180px]`}>Rol<Select compacto name="rol" defaultValue={filtrosUsuarios?.rol ?? ""}>
          <option value="">Todos</option><option value="administrador">Administradores</option><option value="empleado">Empleados</option>
        </Select></label>
        <label className={`${ETIQUETA} w-full sm:w-[180px]`}>Estado<Select compacto name="estado" defaultValue={filtrosUsuarios?.activo === undefined ? "" : filtrosUsuarios.activo ? "activo" : "inactivo"}>
          <option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
        </Select></label>
        <div className="flex items-center gap-2">
          <Link href={seguridad ? rutas.auditoria : rutas.usuarios.lista} className={buttonVariants({ variant: "ghost" })}>Limpiar</Link>
          <button className={buttonVariants()}><SlidersHorizontal aria-hidden="true" />Filtrar</button>
        </div>
      </form>}
      {modulo === "categorias" && <div className="flex flex-wrap items-end gap-4 rounded-card border border-borde bg-superficie px-5 py-4">
        <form className="flex flex-1 flex-wrap items-end gap-4" method="get">
          <label className={`${ETIQUETA} w-full sm:w-[220px]`}>Mostrar
            <Select compacto name="tipo" defaultValue={tipoCategoria ?? ""}>
              <option value="">Ingresos y gastos</option><option value="ingreso">Solo ingresos</option><option value="gasto">Solo gastos</option>
            </Select>
          </label>
          {admin && <label className={`${ETIQUETA} w-full sm:w-[180px]`}>Estado
            <Select compacto name="estado" defaultValue={estadoCategoria ?? ""}>
              <option value="">Todas</option><option value="activa">Activas</option><option value="inactiva">Inactivas</option>
            </Select>
          </label>}
          <button className={buttonVariants()}><SlidersHorizontal aria-hidden="true" />Aplicar filtro</button>
        </form>
        <span className="pb-3 text-[13px] text-texto-suave">{categorias.length} {categorias.length === 1 ? "categoría" : "categorías"}</span>
        {admin && <CategoryDialog accion={accion} />}
      </div>}
      {modulo === "categorias" ? <section aria-label="Categorías disponibles" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {categorias.map((c) => {
          const ingreso = c.tipo === "ingreso";
          return <article key={c.id} className="rounded-card border border-borde bg-superficie p-6">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-input", ingreso ? "bg-exito-tinte text-exito" : "bg-acento-tinte text-acento")}>
                {ingreso ? <CircleDollarSign aria-hidden="true" className="size-5" /> : <ReceiptText aria-hidden="true" className="size-5" />}
              </span>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Badge variant={ingreso ? "success" : "accent"}>{ingreso ? "Ingreso" : "Gasto"}</Badge>
                <StatusDot tono={c.activo ? "success" : "neutral"}>{c.activo ? "Activa" : "Inactiva"}</StatusDot>
              </div>
            </div>
            <p className={cn("mt-5 font-mono text-xs", ingreso ? "text-exito" : "text-acento")}>{c.codigo}</p>
            <h2 className={cn("mt-1 text-lg font-medium tracking-[-0.02em]", !c.activo && "text-texto-suave")}>{c.nombre}</h2>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-texto-suave">{c.descripcion || "Sin descripción de uso disponible."}</p>
            {admin && <div className="relative mt-5 border-t border-borde pt-4">
              <CategoryDialog categoria={c} accion={accion} />
              <div className="absolute right-0 top-4 flex h-8 items-center"><CategoryStatusSwitch categoria={c} accion={accion} /></div>
            </div>}
          </article>;
        })}
        {categorias.length === 0 && <EmptyState className="md:col-span-2 xl:col-span-3" icono={ReceiptText} titulo="No hay categorías disponibles" />}
      </section> : <div className="overflow-hidden rounded-card border border-borde bg-superficie">
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-borde bg-superficie-fila"><tr className="text-left">
            <th className="etiqueta-mono h-11 px-6 font-medium">Usuario</th><th className="etiqueta-mono h-11 px-6 font-medium">Correo electrónico</th>
            <th className="etiqueta-mono h-11 px-6 font-medium">Rol</th><th className="etiqueta-mono h-11 px-6 font-medium">Estado</th>
            <th className="etiqueta-mono h-11 px-6 font-medium">Fecha de creación</th><th className="etiqueta-mono h-11 px-6 text-right font-medium">Acciones</th>
          </tr></thead>
          <tbody className="[&_tr:last-child]:border-0">{perfiles.map((usuario) => <tr key={usuario.usuario_id} className="border-b border-borde hover:bg-superficie-fila">
            <td className="px-6 py-[13px]"><div className="flex items-center gap-3"><Avatar nombre={usuario.nombre} className="size-10" />
              <p className="text-sm font-medium">{usuario.nombre}</p></div></td>
            <td className="px-6 py-[13px] text-texto-2">{usuario.correo}</td>
            <td className="px-6 py-[13px]"><Badge variant={usuario.rol === "administrador" ? "info" : "neutral"}>
              {usuario.rol === "administrador" ? <ShieldCheck aria-hidden="true" /> : <User aria-hidden="true" />}
              {usuario.rol === "administrador" ? "Administrador" : "Empleado"}</Badge></td>
            <td className="px-6 py-[13px]"><StatusDot tono={usuario.activo ? "success" : "neutral"}>{usuario.activo ? "Activo" : "Inactivo"}</StatusDot></td>
            <td className="whitespace-nowrap px-6 py-[13px] font-mono text-xs text-texto-2">{fechaCorta(usuario.creado_en)}</td>
            <td className="px-6 py-[13px] text-right"><UserActionsLink usuario={usuario} seguridad={seguridad} /></td>
          </tr>)}</tbody>
        </table></div>
        {perfiles.length === 0 && <p className="p-8 text-center text-sm text-texto-suave">No hay usuarios que coincidan con los filtros.</p>}
      </div>}
    </>}
  </div>;
}
