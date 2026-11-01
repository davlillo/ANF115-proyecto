"use client";

import { useActionState } from "react";
import { Switch } from "@/components/atoms/switch";
import type { AccionOperacion, PerfilAdministrado } from "@/types/finanzas";

export function UserStatusSwitch({ usuario, accion }: {
  usuario: PerfilAdministrado;
  accion: AccionOperacion;
}) {
  const [estado, formAction, pendiente] = useActionState(accion, { ok: false, mensaje: "" });

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="operacion" value="usuario" />
      <input type="hidden" name="id" value={usuario.usuario_id} />
      <input type="hidden" name="versionEsperada" value={usuario.actualizado_en} />
      <input type="hidden" name="nombre" value={usuario.nombre} />
      <input type="hidden" name="rol" value={usuario.rol} />
      <input type="hidden" name="activo" value={String(!usuario.activo)} />
      <Switch
        type="submit"
        activo={usuario.activo}
        aria-label={`${usuario.activo ? "Desactivar" : "Activar"} ${usuario.nombre}`}
        title={`${usuario.activo ? "Desactivar" : "Activar"} usuario`}
        disabled={pendiente}
      />
      <span className={usuario.activo ? "text-sm text-texto" : "text-sm text-texto-suave"}>
        {usuario.activo ? "Activo" : "Inactivo"}
      </span>
      {!estado.ok && estado.mensaje && <span role="alert" className="sr-only">{estado.mensaje}</span>}
    </form>
  );
}
