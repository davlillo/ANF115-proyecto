"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { FormField } from "@/components/molecules/form-field";
import type { AccionOperacion, CampoOperacion, EstadoOperacion } from "@/types/finanzas";

type Presentacion = "estandar" | "movimiento" | "anulacion";

export function OperationForm({ accion, operacion, campos, ocultos = {}, texto = "Guardar", solicitud, presentacion = "estandar", requiereCambios = false, unaColumna = false, alConfirmar }: {
  accion: AccionOperacion; operacion: string; campos: CampoOperacion[];
  ocultos?: Record<string, string>; texto?: string; solicitud?: string;
  presentacion?: Presentacion;
  requiereCambios?: boolean;
  unaColumna?: boolean;
  alConfirmar?: () => void;
}) {
  const financiero = presentacion === "movimiento";
  const formRef = useRef<HTMLFormElement>(null);
  const [iniciales, setIniciales] = useState<Record<string, string>>(() => Object.fromEntries(campos.map((c) => [c.nombre, c.valor ?? ""])));
  const [valores, setValores] = useState<Record<string, string>>(() => ({ ...iniciales }));
  const [solicitudId, setSolicitudId] = useState(solicitud);
  const [estado, action, pendiente] = useActionState<EstadoOperacion, FormData>(async (anterior, datos) => {
    const resultado = await accion(anterior, datos);
    if (resultado.ok) {
      if (financiero) {
        setValores({ ...iniciales });
        setSolicitudId(crypto.randomUUID());
      } else if (requiereCambios) {
        setIniciales({ ...valores });
      }
      alConfirmar?.();
    }
    return resultado;
  }, { ok: false, mensaje: "" });
  const uid = useId();
  useEffect(() => {
    const primero = Object.keys(estado.campos ?? {})[0];
    if (!primero || pendiente) return;
    const campo = formRef.current?.elements.namedItem(primero);
    if (campo instanceof HTMLElement) campo.focus();
  }, [estado, pendiente]);
  const anulacion = presentacion === "anulacion";
  const hayCambios = campos.some((campo) => valores[campo.nombre] !== iniciales[campo.nombre]);
  const columnas = financiero
    ? "grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_160px_170px_240px]"
    : unaColumna || anulacion ? "grid-cols-1 gap-4" : "gap-4 sm:grid-cols-2";
  // Controlled fields reset explicitly; native action resets can desynchronize base-select.
  return <form ref={formRef} action={action} onReset={(event) => event.preventDefault()} className="space-y-4">
    <input type="hidden" name="operacion" value={operacion} />
    {solicitudId && <input type="hidden" name="solicitud_id" value={solicitudId} />}
    {Object.entries(ocultos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    <div className={`grid ${columnas}`}>
      {campos.map((c) => {
        const id = `${uid}-${c.nombre}`;
        const error = estado.campos?.[c.nombre];
        const props = { id, name: c.nombre, required: c.requerido, value: valores[c.nombre] ?? "",
          disabled: pendiente,
          placeholder: c.placeholder,
          "aria-invalid": !!error, "aria-describedby": [c.ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            setValores((v) => ({ ...v, [c.nombre]: e.target.value }));
          } };
        const esMonto = c.nombre === "monto" && financiero;
        return <FormField key={c.nombre} id={id} etiqueta={c.etiqueta} ayuda={c.ayuda} error={error} requerido={financiero && c.requerido}
          className={c.tipo === "textarea" && !unaColumna && !anulacion ? "sm:col-span-2" : undefined}>
          {c.tipo === "select" ? <Select {...props}>{c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}</Select>
            : c.tipo === "textarea" ? <Textarea {...props} maxLength={c.maxLength} rows={3} />
              : esMonto
                ? <Input {...props} prefijo="$" type="text" maxLength={c.maxLength} inputMode="decimal" />
                : <Input {...props} type={c.tipo ?? "text"} minLength={c.minLength} maxLength={c.maxLength}
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
          disabled={pendiente || (requiereCambios && !hayCambios) || (estado.ok && !solicitud && !requiereCambios)}>
          {financiero && <Save aria-hidden="true" />}
          {pendiente ? "Guardando…" : texto}
        </Button>
      </div>
    </div>
  </form>;
}
