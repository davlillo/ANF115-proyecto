"use client";

import { useActionState, useId, useState } from "react";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { FormField } from "@/components/molecules/form-field";
import type { AccionOperacion, CampoOperacion } from "@/types/finanzas";

type Presentacion = "estandar" | "movimiento" | "anulacion";

export function OperationForm({ accion, operacion, campos, ocultos = {}, texto = "Guardar", solicitud, presentacion = "estandar", requiereCambios = false, unaColumna = false }: {
  accion: AccionOperacion; operacion: string; campos: CampoOperacion[];
  ocultos?: Record<string, string>; texto?: string; solicitud?: string;
  presentacion?: Presentacion;
  requiereCambios?: boolean;
  unaColumna?: boolean;
}) {
  const [estado, action, pendiente] = useActionState(accion, { ok: false, mensaje: "" });
  const [iniciales] = useState<Record<string, string>>(() => Object.fromEntries(campos.map((c) => [c.nombre, c.valor ?? ""])));
  const [valores, setValores] = useState<Record<string, string>>(() => ({ ...iniciales }));
  const [solicitudId, setSolicitudId] = useState(solicitud);
  const uid = useId();
  const financiero = presentacion === "movimiento";
  const anulacion = presentacion === "anulacion";
  const hayCambios = campos.some((campo) => valores[campo.nombre] !== iniciales[campo.nombre]);
  const columnas = financiero
    ? "grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_260px]"
    : unaColumna || anulacion ? "grid-cols-1 gap-4" : "gap-4 sm:grid-cols-2";
  return <form action={action} className="space-y-4">
    <input type="hidden" name="operacion" value={operacion} />
    {solicitudId && <input type="hidden" name="solicitud_id" value={solicitudId} />}
    {Object.entries(ocultos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    <div className={`grid ${columnas}`}>
      {campos.map((c) => {
        const id = `${uid}-${c.nombre}`;
        const error = estado.campos?.[c.nombre];
        const props = { id, name: c.nombre, required: c.requerido, value: valores[c.nombre] ?? "",
          placeholder: c.placeholder,
          "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            setValores((v) => ({ ...v, [c.nombre]: e.target.value }));
            if (estado.ok && solicitud) setSolicitudId(crypto.randomUUID());
          } };
        const esMonto = c.nombre === "monto" && financiero;
        return <FormField key={c.nombre} id={id} etiqueta={c.etiqueta} error={error} requerido={financiero && c.requerido}
          className={c.tipo === "textarea" && !unaColumna && !anulacion ? "sm:col-span-2" : undefined}>
          {c.tipo === "select" ? <Select {...props}>{c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}</Select>
            : c.tipo === "textarea" ? <Textarea {...props} maxLength={c.maxLength} rows={3} />
              : esMonto
                ? <Input {...props} prefijo="$" type="text" maxLength={c.maxLength} inputMode="decimal" />
                : <Input {...props} type={c.tipo ?? "text"} maxLength={c.maxLength}
                  autoComplete={c.tipo === "password" ? "new-password" : undefined}
                  inputMode={c.nombre === "monto" ? "decimal" : undefined} />}
        </FormField>;
      })}
    </div>
    <p role="status" aria-live="polite" className={estado.ok ? "text-sm text-exito" : "text-sm text-peligro"}>{estado.mensaje}</p>
    <div className={financiero ? "flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-5" : "flex flex-wrap items-center gap-4"}>
      {financiero && <p className="flex items-center gap-2 text-[13px] text-texto-suave">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        El movimiento queda registrado a tu nombre y aparece en la bitácora.
      </p>}
      <div className={`flex flex-wrap items-center gap-2 ${financiero || anulacion ? "ml-auto" : ""}`}>
        {financiero && <Button variant="ghost" onClick={() => setValores({ ...iniciales })} disabled={pendiente}>Limpiar</Button>}
        <Button type="submit" variant={anulacion ? "danger-solid" : "primary"}
          disabled={pendiente || (requiereCambios && !hayCambios) || (estado.ok && !solicitud)}>
          {financiero && <Save aria-hidden="true" />}
          {pendiente ? "Guardando…" : texto}
        </Button>
      </div>
      {estado.ok && solicitud && <a href="" className="text-sm text-acento underline">Continuar con una nueva operación</a>}
    </div>
  </form>;
}
