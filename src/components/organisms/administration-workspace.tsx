import { BookOpen, CircleDollarSign, Filter, Pencil, Plus, ReceiptText, Search, Tags, UserRound } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { CategoryStatusSwitch } from "@/components/molecules/category-status-switch";
import { UserStatusSwitch } from "@/components/molecules/user-status-switch";
import { UserActionsMenu } from "@/components/organisms/users/user-actions-menu";
import { OperationForm } from "./operation-form";
import { describirAccion, describirActor, describirEntidad, formatearInstante, resumirCambio } from "@/lib/bitacora";
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

export function AdministrationWorkspace({ modulo, perfil, categorias, perfiles, eventos, accion, tipoCategoria, estadoCategoria, filtrosUsuarios }: {
  modulo: "usuarios" | "categorias" | "bitacora"; perfil: Perfil; categorias: Categoria[];
  perfiles: PerfilAdministrado[]; eventos: EventoBitacoraVista[]; accion: AccionOperacion;
  tipoCategoria?: "ingreso" | "gasto";
  estadoCategoria?: "activa" | "inactiva";
  filtrosUsuarios?: { buscar?: string; rol?: "administrador" | "empleado"; activo?: boolean };
}) {
  const admin = perfil.rol === "administrador";
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-primario">Panadería Carlitos · Datos simulados</p>
      <h1 className="mt-2 font-serif text-4xl">{modulo === "usuarios" ? "Usuarios" : modulo === "categorias" ? "Categorías" : "Seguridad y bitácora"}</h1>
      <p className="mt-3 text-sm text-texto-suave">{modulo === "usuarios" ? "Identidades administradas en Supabase Auth. La desactivación bloquea el acceso operativo." : modulo === "categorias" ? "Clasificación de cobros y pagos. Desactivar conserva el historial." : "Registro de cambios confirmados. Solo administradores activos pueden consultar este historial."}</p>
    </header>
    {modulo === "bitacora" ? <>
      <section className="rounded-card border border-borde bg-superficie p-5"><h2 className="font-serif text-xl">Controles de acceso</h2>
        <p className="mt-2 text-sm">Las cuentas inactivas no operan. El empleado accede solo a sus movimientos; el administrador gestiona usuarios y categorías. Las contraseñas y los eventos de sesión se administran en Auth, no en esta bitácora.</p></section>
      <div className="overflow-x-auto rounded-card border border-borde bg-superficie p-5"><table className="w-full text-sm"><thead><tr className="border-b border-borde text-left">{["Fecha y hora", "Acción", "Entidad", "Actor", "Detalle"].map((t) => <th key={t} className="p-3">{t}</th>)}</tr></thead>
        <tbody>{eventos.map((e) => {
          const etiquetaAccion = describirAccion(e.accion);
          const actor = describirActor(e.actor_nombre, e.actor_rol, e.actor_id);
          const resumen = resumirCambio(e.accion, e.entidad, e.antes, e.despues);
          return (
            <tr key={e.id} className="border-b border-borde align-top">
              <td className="p-3 whitespace-nowrap"><time dateTime={e.fecha_hora}>{formatearInstante(e.fecha_hora)}</time></td>
              <td className="p-3"><Badge variant={etiquetaAccion.tono}>{etiquetaAccion.etiqueta}</Badge></td>
              <td className="p-3">{describirEntidad(e.entidad)}</td>
              <td className="p-3">
                <strong className="block font-medium">{actor.nombre}</strong>
                <span className="text-xs text-texto-suave">{actor.detalle}</span>
              </td>
              <td className="p-3">
                <details>
                  <summary className="cursor-pointer text-primario">Ver cambio</summary>
                  <div className="mt-3 space-y-3">
                    <p className="font-medium">
                      {resumen.titulo}
                      {resumen.sujeto && <span className="font-normal text-texto-suave"> · {resumen.sujeto}</span>}
                    </p>
                    {e.motivo && <p className="text-sm"><span className="font-medium">Motivo:</span> {e.motivo}</p>}
                    {resumen.filas.length > 0 && (
                      <table className="w-full max-w-md text-xs">
                        <thead>
                          <tr className="text-left text-texto-suave">
                            <th className="py-1 pr-3 font-medium">Campo</th>
                            {resumen.mostrarAntes && <th className="py-1 pr-3 font-medium">Antes</th>}
                            <th className="py-1 font-medium">{resumen.mostrarAntes ? "Después" : "Valor"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumen.filas.map((f) => (
                            <tr key={f.campo} className="border-t border-borde">
                              <td className="py-1.5 pr-3 font-medium">{f.campo}</td>
                              {resumen.mostrarAntes && <td className="py-1.5 pr-3 text-texto-suave">{f.antes}</td>}
                              <td className="py-1.5">{f.despues}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-texto-suave">Datos técnicos</summary>
                      <pre className="mt-2 max-w-lg overflow-auto">{JSON.stringify({ antes: e.antes, despues: e.despues }, null, 2)}</pre>
                    </details>
                  </div>
                </details>
              </td>
            </tr>
          );
        })}</tbody>
      </table>{eventos.length === 0 && <p className="p-5 text-sm">No hay eventos en esta página.</p>}</div>
    </> : <>
      {admin && modulo === "usuarios" && <details className="group">
        <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-input bg-primario px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario [&::-webkit-details-marker]:hidden">
          <Plus aria-hidden="true" className="size-4" />Registrar usuario
        </summary>
        <div className="mt-4 rounded-card border border-borde bg-superficie p-5 shadow-card"><h2 className="mb-4 font-serif text-2xl">Registrar usuario</h2>
          <OperationForm accion={accion} operacion="usuario" campos={camposUsuario()} texto="Crear cuenta" />
        </div>
      </details>}
      {admin && modulo === "categorias" && <details className="group">
        <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-input bg-primario px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario [&::-webkit-details-marker]:hidden">
          <Plus aria-hidden="true" className="size-4" />Nueva categoría
        </summary>
        <div className="mt-4 rounded-card border border-borde bg-superficie p-5 shadow-card">
          <h2 className="mb-4 font-serif text-2xl">Nueva categoría</h2>
          <OperationForm accion={accion} operacion="categoria" ocultos={{ activo: "true" }} campos={camposCategoria()} texto="Crear categoría" />
        </div>
      </details>}
      {modulo === "usuarios" && <form method="get" className="grid items-end gap-3 rounded-card border border-borde bg-superficie p-5 shadow-card md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
        <label className="text-xs font-semibold">Buscar
          <span className="relative mt-1 block"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave" />
            <input name="buscar" defaultValue={filtrosUsuarios?.buscar ?? ""} placeholder="Nombre, correo o identificador" className="h-10 w-full rounded-input border border-borde-fuerte bg-superficie pl-10 pr-3 text-sm" />
          </span>
        </label>
        <label className="text-xs font-semibold">Rol<select name="rol" defaultValue={filtrosUsuarios?.rol ?? ""} className="mt-1 block h-10 w-full rounded-input border border-borde-fuerte bg-superficie px-3 text-sm">
          <option value="">Todos</option><option value="administrador">Administradores</option><option value="empleado">Empleados</option>
        </select></label>
        <label className="text-xs font-semibold">Estado<select name="estado" defaultValue={filtrosUsuarios?.activo === undefined ? "" : filtrosUsuarios.activo ? "activo" : "inactivo"} className="mt-1 block h-10 w-full rounded-input border border-borde-fuerte bg-superficie px-3 text-sm">
          <option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
        </select></label>
        <div className="flex gap-2"><button className="h-10 rounded-input bg-cafe-900 px-4 text-sm font-semibold text-crema-50">Filtrar</button>
          <a href="/usuarios" className="flex h-10 items-center rounded-input border border-borde px-3 text-sm text-texto-suave hover:bg-superficie-tenue">Limpiar</a></div>
      </form>}
      {modulo === "categorias" && <>
        <section className="grid gap-4 rounded-card border border-borde bg-superficie p-5 shadow-card lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primario/10 text-primario"><BookOpen aria-hidden="true" className="size-5" /></span>
            <div><h2 className="font-serif text-xl">Guía para clasificar movimientos</h2>
              <p className="mt-1 max-w-3xl text-sm text-texto-suave">Elige una categoría de ingreso cuando registres dinero recibido por ventas. Usa una categoría de gasto cuando registres un pago realizado por la operación. Estas son categorías operativas, no cuentas contables.</p></div>
          </div>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="text-xs font-semibold"><span className="flex items-center gap-1.5"><Filter aria-hidden="true" className="size-3.5" />Mostrar</span>
              <select name="tipo" defaultValue={tipoCategoria ?? ""} className="mt-1 h-10 min-w-48 rounded-input border border-borde-fuerte bg-superficie px-3 text-sm">
                <option value="">Ingresos y gastos</option><option value="ingreso">Solo ingresos</option><option value="gasto">Solo gastos</option>
              </select>
            </label>
            {admin && <label className="text-xs font-semibold">Estado
              <select name="estado" defaultValue={estadoCategoria ?? ""} className="mt-1 block h-10 min-w-36 rounded-input border border-borde-fuerte bg-superficie px-3 text-sm">
                <option value="">Todas</option><option value="activa">Activas</option><option value="inactiva">Inactivas</option>
              </select>
            </label>}
            <button className="h-10 rounded-input bg-cafe-900 px-4 text-sm font-semibold text-crema-50">Aplicar filtro</button>
          </form>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-2xl"><Tags aria-hidden="true" className="size-5 text-primario" />Categorías disponibles</h2>
          <span className="text-sm text-texto-suave">{categorias.length} {categorias.length === 1 ? "categoría" : "categorías"}</span>
        </div>
      </>}
      {modulo === "categorias" ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categorias.map((c) => <article key={c.id} className={`rounded-card border bg-superficie p-5 shadow-card ${c.tipo === "ingreso" ? "border-exito/25" : "border-peligro/25"}`}>
          <div className="flex items-start justify-between gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${c.tipo === "ingreso" ? "bg-exito/10 text-exito" : "bg-peligro/10 text-peligro"}`}>
              {c.tipo === "ingreso" ? <CircleDollarSign aria-hidden="true" className="size-5" /> : <ReceiptText aria-hidden="true" className="size-5" />}
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={c.tipo === "ingreso" ? "success" : "danger"}>{c.tipo === "ingreso" ? "Ingreso" : "Gasto"}</Badge>
              <Badge variant={c.activo ? "neutral" : "warning"}>{c.activo ? "Activa" : "Inactiva"}</Badge>
            </div>
          </div>
          <p className="mt-4 font-mono text-xs font-semibold text-primario">{c.codigo}</p>
          <h3 className="mt-1 font-serif text-xl">{c.nombre}</h3>
          <p className="mt-3 min-h-10 text-sm leading-relaxed text-texto-suave">{c.descripcion || "Sin descripción de uso disponible."}</p>
          {admin && <div className="relative mt-4 border-t border-borde pt-3">
            <details className="w-full">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-semibold text-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario [&::-webkit-details-marker]:hidden">
                <Pencil aria-hidden="true" className="size-4" />Editar
              </summary>
              <div className="mt-5"><p className="mb-4 max-w-sm text-xs leading-relaxed text-texto-suave">Después de usar una categoría, su código y tipo no se pueden cambiar.</p>
                <OperationForm accion={accion} operacion="categoria"
                  ocultos={{ id: c.id, versionEsperada: c.actualizado_en, activo: String(c.activo) }}
                  campos={camposCategoria(c)} requiereCambios unaColumna />
              </div>
            </details>
            <div className="absolute right-0 top-3"><CategoryStatusSwitch categoria={c} accion={accion} /></div>
          </div>}
        </article>)}
        {categorias.length === 0 && <p className="rounded-card border border-borde bg-superficie p-8">No hay categorías disponibles.</p>}
      </section> : <div className="overflow-x-auto rounded-card border border-borde bg-superficie shadow-card">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-borde bg-superficie-tenue text-left text-xs text-texto-suave"><tr>
            <th className="px-5 py-3 font-semibold">Usuario</th><th className="px-5 py-3 font-semibold">Correo electrónico</th>
            <th className="px-5 py-3 font-semibold">Rol</th><th className="px-5 py-3 font-semibold">Estado</th>
            <th className="px-5 py-3 font-semibold">Fecha de creación</th><th className="px-5 py-3 text-right font-semibold">Acciones</th>
          </tr></thead>
          <tbody>{perfiles.map((usuario) => <tr key={usuario.usuario_id} className="border-b border-borde/70 last:border-0 hover:bg-crema-100/50">
            <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primario/10 text-primario"><UserRound aria-hidden="true" className="size-4" /></span>
              <p className="font-semibold">{usuario.nombre}</p></div></td>
            <td className="px-5 py-3 text-texto-suave">{usuario.correo}</td>
            <td className="px-5 py-3"><Badge variant={usuario.rol === "administrador" ? "danger" : "primary"}>{usuario.rol === "administrador" ? "Administrador" : "Empleado"}</Badge></td>
            <td className="px-5 py-3"><UserStatusSwitch usuario={usuario} accion={accion} /></td>
            <td className="whitespace-nowrap px-5 py-3 text-texto-suave">{fechaCorta(usuario.creado_en)}</td>
            <td className="px-5 py-3"><UserActionsMenu usuario={usuario} eventos={eventos.filter((evento) => evento.actor_id === usuario.usuario_id)} accion={accion} /></td>
          </tr>)}</tbody>
        </table>
        {perfiles.length === 0 && <p className="p-8 text-center text-sm text-texto-suave">No hay usuarios que coincidan con los filtros.</p>}
      </div>}
    </>}
  </div>;
}