import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/atoms/avatar";
import { buttonVariants } from "@/components/atoms/button";
import { UserStatusSwitch } from "@/components/molecules/user-status-switch";
import { AuditTable } from "@/components/organisms/audit-table";
import { OperationForm } from "@/components/organisms/operation-form";
import { rutas } from "@/config/rutas";
import { formatearInstante } from "@/lib/bitacora";
import type { AccionOperacion, EventoBitacoraVista, PerfilAdministrado } from "@/types/finanzas";

export function UserWorkspace({ usuario, eventos, accion, seguridad = false }: {
  usuario: PerfilAdministrado;
  eventos: EventoBitacoraVista[];
  accion: AccionOperacion;
  seguridad?: boolean;
}) {
  return <div className="space-y-6">
    <h1 className="sr-only">{seguridad ? `Seguridad de ${usuario.nombre}` : `Gestionar ${usuario.nombre}`}</h1>
    <Link href={seguridad ? rutas.auditoria : rutas.usuarios.lista} className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <ArrowLeft aria-hidden="true" />{seguridad ? "Volver a seguridad" : "Volver a usuarios"}
    </Link>
    <section className="rounded-card border border-borde bg-superficie p-6 sm:p-8">
      <header className="mb-6 flex items-center gap-4">
        <Avatar nombre={usuario.nombre} className="size-12" />
        <div className="min-w-0"><h2 className="text-xl font-medium">{usuario.nombre}</h2><p className="mt-1 break-all text-sm text-texto-suave">{usuario.correo}</p></div>
      </header>
      {seguridad ? <>
        <dl className="grid gap-5 border-t border-borde pt-6 text-sm sm:grid-cols-2">
          <div><dt className="text-texto-suave">Identificador</dt><dd className="mt-1 break-all font-mono text-xs">{usuario.usuario_id}</dd></div>
          <div><dt className="text-texto-suave">Fecha de creación</dt><dd className="mt-1">{formatearInstante(usuario.creado_en)}</dd></div>
          <div><dt className="text-texto-suave">Rol</dt><dd className="mt-1 capitalize">{usuario.rol}</dd></div>
          <div><dt className="mb-2 text-texto-suave">Acceso al sistema</dt><dd><UserStatusSwitch usuario={usuario} accion={accion} /></dd></div>
        </dl>
        <p className="mt-6 text-sm text-texto-suave">Desactivar bloquea el acceso operativo y conserva los movimientos y la bitácora.</p>
      </> : <OperationForm accion={accion} operacion="usuario"
        ocultos={{ id: usuario.usuario_id, versionEsperada: usuario.actualizado_en }}
        campos={[
          { nombre: "nombre", etiqueta: "Nombre", valor: usuario.nombre, requerido: true, maxLength: 120 },
          { nombre: "rol", etiqueta: "Rol", tipo: "select", valor: usuario.rol,
            opciones: [{ valor: "empleado", etiqueta: "Empleado" }, { valor: "administrador", etiqueta: "Administrador" }] },
        ]} texto="Guardar cambios" requiereCambios />}
    </section>
    {seguridad && <section className="space-y-3">
      <h2 className="text-[17px] font-semibold">Actividad de {usuario.nombre}</h2>
      <AuditTable eventos={eventos} />
    </section>}
  </div>;
}
