import { BookOpen, CircleDollarSign, KeyRound, Pencil, Plus, ReceiptText, Search, ShieldCheck, SlidersHorizontal, User, UserPlus, UserX } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { buttonVariants } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { StatusDot } from "@/components/atoms/status-dot";
import { Banner } from "@/components/molecules/banner";
import { CategoryStatusSwitch } from "@/components/molecules/category-status-switch";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageHeader } from "@/components/molecules/page-header";
import { UserStatusSwitch } from "@/components/molecules/user-status-switch";
import { AuditRow } from "@/components/organisms/audit-row";
import { UserActionsMenu } from "@/components/organisms/users/user-actions-menu";
import { OperationForm } from "./operation-form";
import { describirAccion, describirActor, describirEntidad, formatearInstante, resumirCambio } from "@/lib/bitacora";
import { cn } from "@/lib/utils";
import type { AccionOperacion, Categoria, Perfil, PerfilAdministrado, EventoBitacoraVista, CampoOperacion } from "@/types/finanzas";

function fechaCorta(valor: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(valor));
}

function camposCategoria(c?: Categoria): CampoOperacion[] {
  return [
    { nombre: "codigo", etiqueta: "Código (I01 / G01)", valor: c?.codigo, requerido: true },
    { nombre: "nombre", etiqueta: "Nombre", valor: c?.nombre, requerido: true, maxLength: 100 },
    { nombre: "tipo", etiqueta: "Tipo", tipo: "select", valor: c?.tipo ?? "ingreso", opciones: [{ valor: "ingreso", etiqueta: "Ingreso" }, { valor: "gasto", etiqueta: "Gasto" }] },
    { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", valor: c?.descripcion, maxLength: 500 },
  ];
}

function camposUsuario(p?: Perfil): CampoOperacion[] {
  return [
    { nombre: "nombre", etiqueta: "Nombre", valor: p?.nombre, requerido: true, maxLength: 120 },
    ...(!p ? [
      { nombre: "correo", etiqueta: "Correo", tipo: "email" as const, requerido: true },
      { nombre: "contrasena", etiqueta: "Contraseña (mínimo 12 caracteres)", tipo: "password" as const, requerido: true },
    ] : []),
    { nombre: "rol", etiqueta: "Rol", tipo: "select", valor: p?.rol ?? "empleado", opciones: [{ valor: "empleado", etiqueta: "Empleado" }, { valor: "administrador", etiqueta: "Administrador" }] },
    { nombre: "activo", etiqueta: "Estado", tipo: "select", valor: p?.activo ? "true" : "false", opciones: [{ valor: "false", etiqueta: "Inactivo" }, { valor: "true", etiqueta: "Activo" }] },
  ];
}

const ETIQUETA = "flex min-w-0 flex-col gap-1.5 text-xs text-texto-suave";
const RESUMEN_BOTON = `${buttonVariants()} sin-marcador ml-auto w-fit cursor-pointer`;

const CONTROLES = [
  { icono: UserX, titulo: "Cuentas inactivas", texto: "Las cuentas inactivas no operan." },
  { icono: User, titulo: "Empleados", texto: "El empleado accede solo a sus movimientos." },
  { icono: ShieldCheck, titulo: "Administradores", texto: "El administrador gestiona usuarios y categorías." },
  { icono: KeyRound, titulo: "Contraseñas y sesión", texto: "Las contraseñas y los eventos de sesión se administran en Auth, no en esta bitácora." },
] as const;

const ENCABEZADOS = {
  usuarios: { eyebrow: "Administración · Accesos", titulo: "Usuarios", descripcion: "Identidades administradas en Supabase Auth. La desactivación bloquea el acceso operativo." },
  categorias: { eyebrow: "Operación · Clasificación", titulo: "Categorías", descripcion: "Clasificación de cobros y pagos. Desactivar conserva el historial." },
  bitacora: { eyebrow: "Administración · Auditoría", titulo: "Seguridad y bitácora", descripcion: "Registro de cambios confirmados. Solo administradores activos pueden consultar este historial." },
} as const;

export function AdministrationWorkspace({ modulo, perfil, categorias, perfiles, eventos, accion, tipoCategoria, estadoCategoria, filtrosUsuarios }: {
  modulo: "usuarios" | "categorias" | "bitacora"; perfil: Perfil; categorias: Categoria[];
  perfiles: PerfilAdministrado[]; eventos: EventoBitacoraVista[]; accion: AccionOperacion;
  tipoCategoria?: "ingreso" | "gasto";
  estadoCategoria?: "activa" | "inactiva";
  filtrosUsuarios?: { buscar?: string; rol?: "administrador" | "empleado"; activo?: boolean };
}) {
  const admin = perfil.rol === "administrador";
  const encabezado = ENCABEZADOS[modulo];
  return <div className="space-y-6">
    <PageHeader eyebrow={encabezado.eyebrow} titulo={encabezado.titulo} descripcion={encabezado.descripcion} />
    {modulo === "bitacora" ? <>
      <section className="rounded-card border border-borde bg-superficie p-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Controles de acceso</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CONTROLES.map(({ icono: Icono, titulo, texto }) => <div key={titulo} className="rounded-input bg-superficie-fila p-4">
            <span className="flex size-8 items-center justify-center rounded-input border border-borde bg-superficie text-texto-2"><Icono aria-hidden="true" className="size-4" /></span>
            <h3 className="mt-4 text-sm font-semibold">{titulo}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-texto-suave">{texto}</p>
          </div>)}
        </div>
      </section>
      <div className="overflow-hidden rounded-card border border-borde bg-superficie">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="border-b border-borde bg-superficie-fila"><tr className="text-left">
            {["Fecha y hora", "Acción", "Entidad", "Actor"].map((t) => <th key={t} className="etiqueta-mono h-11 px-6 font-medium">{t}</th>)}
            <th className="etiqueta-mono h-11 px-6 text-right font-medium">Detalle</th>
          </tr></thead>
          <tbody className="[&_tr:last-child]:border-0">{eventos.map((e) => <AuditRow key={e.id}
            fechaHoraIso={e.fecha_hora}
            fechaHora={formatearInstante(e.fecha_hora)}
            accion={describirAccion(e.accion)}
            entidad={describirEntidad(e.entidad)}
            actor={describirActor(e.actor_nombre, e.actor_rol, e.actor_id)}
            resumen={resumirCambio(e.accion, e.entidad, e.antes, e.despues)}
            motivo={e.motivo}
            datosTecnicos={JSON.stringify({ antes: e.antes, despues: e.despues }, null, 2)} />)}</tbody>
        </table></div>
        {eventos.length === 0 && <p className="p-6 text-sm text-texto-suave">No hay eventos en esta página.</p>}
      </div>
    </> : <>
      {admin && modulo === "usuarios" && <details className="group">
        <summary className={RESUMEN_BOTON}>
          <UserPlus aria-hidden="true" />Registrar usuario
        </summary>
        <div className="mt-4 rounded-card border border-borde bg-superficie p-6"><h2 className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">Registrar usuario</h2>
          <OperationForm accion={accion} operacion="usuario" campos={camposUsuario()} texto="Crear cuenta" />
        </div>
      </details>}
      {admin && modulo === "categorias" && <details className="group">
        <summary className={RESUMEN_BOTON}>
          <Plus aria-hidden="true" />Nueva categoría
        </summary>
        <div className="mt-4 rounded-card border border-borde bg-superficie p-6">
          <h2 className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">Nueva categoría</h2>
          <OperationForm accion={accion} operacion="categoria" ocultos={{ activo: "true" }} campos={camposCategoria()} texto="Crear categoría" />
        </div>
      </details>}
      {modulo === "usuarios" && <form method="get" className="flex flex-wrap items-end gap-4 rounded-card border border-borde bg-superficie px-5 py-4">
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
          <Link href="/usuarios" className={buttonVariants({ variant: "ghost" })}>Limpiar</Link>
          <button className={buttonVariants()}><SlidersHorizontal aria-hidden="true" />Filtrar</button>
        </div>
      </form>}
      {modulo === "categorias" && <>
        <Banner tono="info" icono={BookOpen} className="px-5 py-4">
          <h2 className="text-sm font-semibold">Guía para clasificar movimientos</h2>
          <p className="mt-1 max-w-4xl text-[13px]">Elige una categoría de ingreso cuando registres dinero recibido por ventas. Usa una categoría de gasto cuando registres un pago realizado por la operación. Estas son categorías operativas, no cuentas contables.</p>
        </Banner>
        <form className="flex flex-wrap items-end gap-4 rounded-card border border-borde bg-superficie px-5 py-4" method="get">
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
          <p className="ml-auto text-[13px] text-texto-suave">{categorias.length} {categorias.length === 1 ? "categoría" : "categorías"}</p>
        </form>
      </>}
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
            <h3 className={cn("mt-1 text-lg font-medium tracking-[-0.02em]", !c.activo && "text-texto-suave")}>{c.nombre}</h3>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-texto-suave">{c.descripcion || "Sin descripción de uso disponible."}</p>
            {admin && <div className="relative mt-5 border-t border-borde pt-4">
              <details className="w-full">
                <summary className={`${buttonVariants({ variant: "ghost", size: "sm" })} sin-marcador w-fit cursor-pointer`}>
                  <Pencil aria-hidden="true" />Editar
                </summary>
                <div className="mt-4"><p className="mb-4 max-w-sm text-xs leading-relaxed text-texto-suave">Después de usar una categoría, su código y tipo no se pueden cambiar.</p>
                  <OperationForm accion={accion} operacion="categoria"
                    ocultos={{ id: c.id, versionEsperada: c.actualizado_en, activo: String(c.activo) }}
                    campos={camposCategoria(c)} requiereCambios unaColumna />
                </div>
              </details>
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
            <td className="px-6 py-[13px]"><UserStatusSwitch usuario={usuario} accion={accion} /></td>
            <td className="whitespace-nowrap px-6 py-[13px] font-mono text-xs text-texto-2">{fechaCorta(usuario.creado_en)}</td>
            <td className="px-6 py-[13px]"><UserActionsMenu usuario={usuario} eventos={eventos.filter((evento) => evento.actor_id === usuario.usuario_id)} accion={accion} /></td>
          </tr>)}</tbody>
        </table></div>
        {perfiles.length === 0 && <p className="p-8 text-center text-sm text-texto-suave">No hay usuarios que coincidan con los filtros.</p>}
      </div>}
    </>}
  </div>;
}
