import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import type { Categoria, FiltroFinanciero } from "@/types/finanzas";

const ETIQUETA = "flex min-w-0 flex-col gap-1.5 text-xs text-texto-suave";

export function FinanceFilters({ filtro, categorias, reportes = false, mostrarEstado = true }: {
  filtro: FiltroFinanciero; categorias: Categoria[]; reportes?: boolean; mostrarEstado?: boolean;
}) {
  return <form className="flex flex-wrap items-end gap-4 rounded-card border border-borde bg-superficie px-5 py-4">
    <label className={`${ETIQUETA} w-full sm:w-[168px]`}>Desde
      <Input compacto name="desde" type="date" defaultValue={filtro.desde} required />
    </label>
    <label className={`${ETIQUETA} w-full sm:w-[168px]`}>Hasta
      <Input compacto name="hasta" type="date" defaultValue={filtro.hasta} required />
    </label>
    <label className={`${ETIQUETA} w-full sm:min-w-[220px] sm:flex-1`}>Categoría
      <Select compacto name="categoria" defaultValue={filtro.categoria ?? ""}>
        <option value="">Todas las categorías</option>{categorias.filter((c) => !filtro.tipo || c.tipo === filtro.tipo).map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}{c.activo ? "" : " (inactiva)"}</option>)}
      </Select>
    </label>
    {mostrarEstado && <label className={`${ETIQUETA} w-full sm:w-[180px]`}>Estado
      <Select compacto name="estado" defaultValue={filtro.estado ?? ""}>
        <option value="">Todos los estados</option><option value="vigente">Vigentes</option><option value="anulado">Anulados</option>
      </Select>
    </label>}
    {reportes ? <label className={`${ETIQUETA} w-full sm:w-[140px]`}>Agrupar por
      <Select compacto name="granularidad" defaultValue={filtro.granularidad}>
        <option value="dia">Día</option><option value="mes">Mes</option><option value="anio">Año</option>
      </Select>
    </label> : null}
    {filtro.tipo && <input type="hidden" name="tipo" value={filtro.tipo} />}
    <Button type="submit" className="h-[38px]"><SlidersHorizontal aria-hidden="true" />Aplicar filtros</Button>
  </form>;
}
