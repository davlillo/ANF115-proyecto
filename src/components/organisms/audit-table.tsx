import { AuditRow } from "@/components/organisms/audit-row";
import { describirAccion, describirActor, describirEntidad, formatearInstante, resumirCambio } from "@/lib/bitacora";
import type { EventoBitacoraVista } from "@/types/finanzas";

export function AuditTable({ eventos }: { eventos: EventoBitacoraVista[] }) {
  return <div className="overflow-hidden rounded-card border border-borde bg-superficie">
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="border-b border-borde bg-superficie-fila"><tr className="text-left">
        {["Fecha y hora", "Acción", "Entidad", "Actor"].map((t) => <th key={t} scope="col" className="etiqueta-mono h-11 px-6 font-medium">{t}</th>)}
        <th scope="col" className="etiqueta-mono h-11 px-6 text-right font-medium">Detalle</th>
      </tr></thead>
      <tbody className="[&_tr:last-child]:border-0">{eventos.map((e) => <AuditRow key={e.id}
        fechaHoraIso={e.fecha_hora} fechaHora={formatearInstante(e.fecha_hora)} accion={describirAccion(e.accion)}
        entidad={describirEntidad(e.entidad)} actor={describirActor(e.actor_nombre, e.actor_rol, e.actor_id)}
        resumen={resumirCambio(e.accion, e.entidad, e.antes, e.despues)} motivo={e.motivo}
        datosTecnicos={JSON.stringify({ antes: e.antes, despues: e.despues }, null, 2)} />)}</tbody>
    </table></div>
    {eventos.length === 0 && <p className="p-6 text-sm text-texto-suave">No hay actividad registrada en esta página.</p>}
  </div>;
}
