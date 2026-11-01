import { TriangleAlert } from "lucide-react";

export function OperationError({ mensaje }: { mensaje: string }) {
  return <section className="flex gap-4 rounded-card border border-peligro/40 bg-superficie p-6" role="alert">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-peligro-tinte text-peligro">
      <TriangleAlert aria-hidden="true" className="size-5" />
    </span>
    <div>
      <h1 className="text-[22px] font-medium tracking-[-0.02em]">No se pudo completar la consulta</h1>
      <p className="mt-2 text-sm">{mensaje}</p>
      <p className="mt-2 text-sm text-texto-suave">Revise su sesión, los filtros y el estado de Supabase local antes de reintentar.</p>
    </div>
  </section>;
}
