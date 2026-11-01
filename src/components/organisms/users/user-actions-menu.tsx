"use client";

import { useState } from "react";
import { Activity, CalendarDays, Eye, Hash, Mail, MoreHorizontal, Pencil, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogEyebrow,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { OperationForm } from "@/components/organisms/operation-form";
import type { AccionOperacion, CampoOperacion, EventoBitacoraVista, PerfilAdministrado } from "@/types/finanzas";

type Vista = "editar" | "detalles" | "actividad" | null;

function fecha(valor: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(valor));
}

export function UserActionsMenu({ usuario, eventos, accion }: {
  usuario: PerfilAdministrado;
  eventos: EventoBitacoraVista[];
  accion: AccionOperacion;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>(null);
  const campos: CampoOperacion[] = [
    { nombre: "nombre", etiqueta: "Nombre", valor: usuario.nombre, requerido: true, maxLength: 120 },
    { nombre: "rol", etiqueta: "Rol", tipo: "select", valor: usuario.rol,
      opciones: [{ valor: "empleado", etiqueta: "Empleado" }, { valor: "administrador", etiqueta: "Administrador" }] },
  ];
  const abrir = (destino: Exclude<Vista, null>) => {
    setMenuAbierto(false);
    setVista(destino);
  };

  const itemMenu = "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-texto-2 hover:bg-superficie-tenue";

  return (
    <div className="relative flex justify-end">
      <button type="button" aria-label={`Acciones de ${usuario.nombre}`} aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto((actual) => !actual)}
        className="flex size-9 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-superficie-tenue hover:text-texto">
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </button>
      {menuAbierto && <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-menu border border-borde bg-superficie p-1.5 text-left shadow-flotante">
        <button type="button" onClick={() => abrir("editar")} className={itemMenu}><Pencil aria-hidden="true" className="size-[15px]" />Editar información</button>
        <button type="button" onClick={() => abrir("detalles")} className={itemMenu}><Eye aria-hidden="true" className="size-[15px]" />Ver detalles</button>
        <button type="button" onClick={() => abrir("actividad")} className={itemMenu}><Activity aria-hidden="true" className="size-[15px]" />Ver actividad</button>
      </div>}

      <Dialog open={vista !== null} onOpenChange={(abierto) => !abierto && setVista(null)}>
        <DialogContent>
          {vista === "editar" && <>
            <DialogHeader><DialogEyebrow>Usuario</DialogEyebrow><DialogTitle>Editar información</DialogTitle><DialogDescription>Cambia el nombre o rol asignado. El estado se administra únicamente desde el interruptor de la tabla.</DialogDescription></DialogHeader>
            <DialogBody><OperationForm accion={accion} operacion="usuario"
              ocultos={{ id: usuario.usuario_id, versionEsperada: usuario.actualizado_en, activo: String(usuario.activo) }}
              campos={campos} requiereCambios /></DialogBody>
          </>}
          {vista === "detalles" && <>
            <DialogHeader><DialogEyebrow>Usuario</DialogEyebrow><DialogTitle>Detalles de {usuario.nombre}</DialogTitle><DialogDescription>Identidad y acceso registrados en el sistema.</DialogDescription></DialogHeader>
            <DialogBody><dl className="space-y-3 text-sm">
              <div className="rounded-input bg-superficie-fila p-3"><dt className="etiqueta-mono flex items-center gap-2"><Mail aria-hidden="true" className="size-3.5" />Correo</dt><dd className="mt-1.5 break-all font-medium">{usuario.correo}</dd></div>
              <div className="rounded-input bg-superficie-fila p-3"><dt className="etiqueta-mono flex items-center gap-2"><Hash aria-hidden="true" className="size-3.5" />Identificador</dt><dd className="mt-1.5 break-all font-mono text-xs">{usuario.usuario_id}</dd></div>
              <div className="rounded-input bg-superficie-fila p-3"><dt className="etiqueta-mono flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-3.5" />Fecha de creación</dt><dd className="mt-1.5 font-medium">{fecha(usuario.creado_en)}</dd></div>
              <div className="rounded-input bg-superficie-fila p-3"><dt className="etiqueta-mono flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-3.5" />Acceso</dt><dd className="mt-1.5 font-medium capitalize">{usuario.rol} · {usuario.activo ? "Activo" : "Inactivo"}</dd></div>
            </dl></DialogBody>
          </>}
          {vista === "actividad" && <>
            <DialogHeader><DialogEyebrow>Usuario</DialogEyebrow><DialogTitle>Actividad de {usuario.nombre}</DialogTitle><DialogDescription>Acciones recientes disponibles en la bitácora para este usuario.</DialogDescription></DialogHeader>
            <DialogBody className="max-h-96 space-y-2">
              {eventos.length === 0 ? <p className="rounded-input bg-superficie-fila p-4 text-sm text-texto-suave">No hay actividad registrada en la consulta disponible.</p>
                : eventos.map((evento) => <article key={evento.id} className="rounded-input border border-borde p-3 text-sm">
                  <div className="flex items-center justify-between gap-3"><strong>{evento.accion}</strong><time className="font-mono text-xs text-texto-suave">{fecha(evento.fecha_hora)}</time></div>
                  <p className="mt-1 text-xs text-texto-suave">{evento.entidad}{evento.motivo ? ` · ${evento.motivo}` : ""}</p>
                </article>)}
            </DialogBody>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
