"use client";

import { useActionState } from "react";
import { Switch } from "@/components/atoms/switch";
import type { AccionOperacion, Categoria } from "@/types/finanzas";

export function CategoryStatusSwitch({ categoria, accion }: {
  categoria: Categoria;
  accion: AccionOperacion;
}) {
  const [estado, formAction, pendiente] = useActionState(accion, { ok: false, mensaje: "" });
  const siguienteEstado = !categoria.activo;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="operacion" value="categoria" />
      <input type="hidden" name="id" value={categoria.id} />
      <input type="hidden" name="versionEsperada" value={categoria.actualizado_en} />
      <input type="hidden" name="codigo" value={categoria.codigo} />
      <input type="hidden" name="nombre" value={categoria.nombre} />
      <input type="hidden" name="tipo" value={categoria.tipo} />
      <input type="hidden" name="descripcion" value={categoria.descripcion} />
      <input type="hidden" name="activo" value={String(siguienteEstado)} />
      <Switch
        type="submit"
        activo={categoria.activo}
        aria-label={`${categoria.activo ? "Desactivar" : "Activar"} ${categoria.nombre}`}
        title={`${categoria.activo ? "Desactivar" : "Activar"} categoría`}
        disabled={pendiente}
      />
      {!estado.ok && estado.mensaje && (
        <span role="alert" className="text-xs text-peligro">{estado.mensaje}</span>
      )}
    </form>
  );
}
