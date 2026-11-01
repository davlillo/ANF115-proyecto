import Link from "next/link";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Download,
  Percent,
  Plus,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatearUSD } from "@/lib/dinero";
import { rutas } from "@/config/rutas";
import { buttonVariants } from "@/components/atoms/button";
import { Banner } from "@/components/molecules/banner";
import { EmptyState } from "@/components/molecules/empty-state";
import { FinanceFilters } from "@/components/molecules/finance-filters";
import { MetricCard } from "@/components/molecules/metric-card";
import { PageHeader } from "@/components/molecules/page-header";
import { MovementRow } from "@/components/organisms/movement-row";
import { OperationForm } from "@/components/organisms/operation-form";
import { cn } from "@/lib/utils";
import type { AccionOperacion, CampoOperacion, VistaFinanciera, Movimiento } from "@/types/finanzas";

function formatearFechaHora(valor: string | null): string {
  if (!valor) return "No disponible";
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(valor));
}

function camposMovimiento(data: VistaFinanciera, tipo: "ingreso" | "gasto", m?: Movimiento): CampoOperacion[] {
  return [
    { nombre: "concepto", etiqueta: "Concepto", requerido: true, valor: m?.concepto, maxLength: 250,
      placeholder: tipo === "ingreso" ? "Ej. Venta de pan integral o repostería" : "Ej. Compra de insumos o pago de servicio" },
    { nombre: "monto", etiqueta: "Monto (USD)", requerido: true, valor: m?.monto, placeholder: "0.00" },
    { nombre: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true, valor: m?.fecha ?? data.fechaSugerida },
    { nombre: "categoria_id", etiqueta: "Categoría", tipo: "select", requerido: true, valor: m?.categoria_id,
      opciones: [{ valor: "", etiqueta: "Selecciona una categoría" }, ...data.categorias.filter((c) => c.tipo === tipo && (c.activo || c.id === m?.categoria_id))
        .map((c) => ({ valor: c.id, etiqueta: `${c.codigo} · ${c.nombre}${c.activo ? "" : " (histórica)"}` }))] },
  ];
}

const ENLACE_PAGINA = "flex size-9 items-center justify-center rounded-full border border-borde-fuerte bg-superficie text-texto hover:bg-superficie-tenue";
const PAGINA_INACTIVA = "flex size-9 items-center justify-center rounded-full border border-borde bg-superficie-tenue text-texto-suave opacity-60";

export function FinanceWorkspace({ data, modulo, accion }: {
  data: VistaFinanciera; modulo: "panel" | "ingreso" | "gasto" | "reportes"; accion: AccionOperacion;
}) {
  const movimiento = modulo === "ingreso" || modulo === "gasto";
  const titulo = modulo === "panel" ? "Panel financiero" : modulo === "reportes" ? "Reportes" : modulo === "ingreso" ? "Ingresos" : "Gastos";
  const eyebrow = movimiento ? "Operación · Cobros y pagos" : modulo === "reportes" ? "Resumen · Reportes" : "Resumen · Indicadores";
  const url = modulo === "ingreso" ? rutas.ingresos : modulo === "gasto" ? rutas.gastos : modulo === "reportes" ? rutas.reportes.lista : rutas.dashboard;
  const totalPaginas = Math.max(1, Math.ceil(data.total / 50));
  const paginar = (pagina: number) => {
    const q = new URLSearchParams({ desde: data.filtro.desde, hasta: data.filtro.hasta, granularidad: data.filtro.granularidad, pagina: String(pagina) });
    if (data.filtro.categoria) q.set("categoria", data.filtro.categoria);
    if (data.filtro.estado) q.set("estado", data.filtro.estado);
    return `${url}?${q}`;
  };
  const descargar = (formato: "pdf" | "xlsx") => {
    const q = new URLSearchParams({ desde: data.filtro.desde, hasta: data.filtro.hasta, granularidad: data.filtro.granularidad });
    if (data.filtro.categoria) q.set("categoria", data.filtro.categoria);
    return `/api/reportes/${formato}?${q}`;
  };
  const codigos = new Map(data.categorias.map((c) => [c.id, c.codigo]));
  const conAcciones = movimiento || data.movimientos.some((m) => m.estado === "anulado");
  const mostrarTipo = !movimiento;
  const resultadoNegativo = data.resumen.resultado.startsWith("-");
  const tonoMovimiento = modulo === "ingreso" ? "exito" : "acento";

  return <div className="space-y-6">
    <PageHeader
      eyebrow={eyebrow}
      titulo={titulo}
      descripcion={`Cobros y pagos · ${data.perfil.rol === "empleado" ? "Solo tus movimientos" : "Todos los movimientos autorizados"} · Datos simulados`}
      acciones={<>
        {modulo === "reportes" && <>
          <a href={descargar("pdf")} download className={buttonVariants({ variant: "secondary" })}><Download aria-hidden="true" />Descargar PDF</a>
          <a href={descargar("xlsx")} download className={buttonVariants()}><Download aria-hidden="true" />Descargar Excel</a>
        </>}
        {movimiento && <a href="#nueva-captura" className={buttonVariants()}><Plus aria-hidden="true" />Registrar {modulo}</a>}
      </>}
    />

    {movimiento && <section id="nueva-captura" className="scroll-mt-24 rounded-card border border-borde bg-superficie p-6">
      <header className="mb-6 flex items-start gap-4">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-input", tonoMovimiento === "exito" ? "bg-exito-tinte text-exito" : "bg-acento-tinte text-acento")}>
          {modulo === "ingreso" ? <Banknote aria-hidden="true" className="size-5" /> : <ReceiptText aria-hidden="true" className="size-5" />}
        </span>
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Registrar {modulo}</h2>
          <p className="mt-0.5 text-[13px] text-texto-suave">Completa la información del {modulo} que deseas registrar en el sistema.</p>
        </div>
      </header>
      <OperationForm accion={accion} operacion="movimiento" ocultos={{ tipo: modulo }} solicitud={crypto.randomUUID()}
        campos={camposMovimiento(data, modulo)} texto={`Guardar ${modulo}`} presentacion="movimiento" />
    </section>}

    <FinanceFilters filtro={data.filtro} categorias={data.categorias} reportes={modulo === "reportes"} />
    <p className="text-[13px] text-texto-suave">Período: <strong className="font-medium text-texto">{data.filtro.desde} — {data.filtro.hasta}</strong>. El estado filtra el detalle; los indicadores siempre excluyen anulados.</p>

    <section aria-label="Indicadores financieros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard etiqueta="Ingresos totales" valor={formatearUSD(data.resumen.ingresos)} icono={TrendingUp} tonoIcono="success" />
      <MetricCard etiqueta="Gastos totales" valor={formatearUSD(data.resumen.gastos)} icono={TrendingDown} tonoIcono="accent" />
      <MetricCard etiqueta="Resultado financiero" valor={<span className={resultadoNegativo ? "text-peligro" : undefined}>{formatearUSD(data.resumen.resultado)}</span>} icono={Scale} />
      <MetricCard etiqueta="Porcentaje de gastos" valor={data.resumen.porcentaje_gastos === null ? "No aplica" : `${data.resumen.porcentaje_gastos} %`} icono={Percent} />
    </section>

    {modulo === "panel" && <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-card border border-borde bg-superficie p-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Ingresos y gastos</h2>
        <p className="mt-0.5 text-[13px] text-texto-suave">Comparativo del período, solo movimientos vigentes</p>
        {(["ingresos", "gastos"] as const).map((tipo) => <div key={tipo} className="mt-6">
          <div className="mb-2 flex justify-between text-sm"><span>{tipo === "ingresos" ? "Ingresos" : "Gastos"}</span><span className="font-mono tabular-nums">{formatearUSD(data.resumen[tipo])}</span></div>
          <div className="h-1.5 overflow-hidden rounded-pill bg-superficie-tenue"><div className={cn("h-full rounded-pill", tipo === "ingresos" ? "bg-exito" : "bg-acento")} style={{ width: `${data.barras[tipo]}%` }} /></div>
        </div>)}
      </section>
      <section className="rounded-card border border-borde bg-superficie p-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Distribución de gastos</h2>
        <p className="mt-0.5 text-[13px] text-texto-suave">Por categoría · total {formatearUSD(data.resumen.gastos)}</p>
        {data.distribucion.length === 0 && <p className="mt-4 text-sm text-texto-suave">No hay gastos vigentes en este período.</p>}
        {data.distribucion.map((c, indice) => <div key={c.categoria} className="mt-5">
          <div className="flex justify-between gap-3 text-sm"><span>{c.categoria}</span><span className="font-mono text-[13px] tabular-nums">{formatearUSD(c.monto)} <span className="text-texto-suave">· {c.ancho}%</span></span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-superficie-tenue"><div className={cn("h-full rounded-pill", indice === 0 ? "bg-acento" : "bg-acento-suave")} style={{ width: `${c.ancho}%` }} /></div>
        </div>)}
      </section>
    </div>}

    {modulo === "reportes" && <section className="space-y-3">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Resumen {data.filtro.granularidad === "dia" ? "diario" : data.filtro.granularidad === "mes" ? "mensual" : "anual"}</h2>
      <div className="overflow-hidden rounded-card border border-borde bg-superficie"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="border-b border-borde bg-superficie-fila"><tr className="text-left">
          <th className="etiqueta-mono h-11 px-6 font-medium">Período</th>
          <th className="etiqueta-mono h-11 px-6 text-right font-medium">Ingresos</th>
          <th className="etiqueta-mono h-11 px-6 text-right font-medium">Gastos</th>
          <th className="etiqueta-mono h-11 px-6 text-right font-medium">Resultado</th>
          <th className="etiqueta-mono h-11 px-6 text-right font-medium">% gastos</th>
        </tr></thead>
        <tbody className="[&_tr:last-child]:border-0">{data.periodos.map((p) => <tr key={p.periodo} className="border-b border-borde hover:bg-superficie-fila">
          <td className="px-6 py-[13px] font-mono text-xs">{p.periodo}</td>
          <td className="px-6 py-[13px] text-right font-mono tabular-nums">{formatearUSD(p.ingresos)}</td>
          <td className="px-6 py-[13px] text-right font-mono tabular-nums">{formatearUSD(p.gastos)}</td>
          <td className={cn("px-6 py-[13px] text-right font-mono tabular-nums", p.resultado.startsWith("-") && "text-peligro")}>{formatearUSD(p.resultado)}</td>
          <td className="px-6 py-[13px] text-right font-mono tabular-nums">{p.porcentaje_gastos === null ? "No aplica" : `${p.porcentaje_gastos}%`}</td>
        </tr>)}</tbody></table></div></div>
    </section>}

    <section className="space-y-3">
      <header>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Detalle de movimientos</h2>
        <p className="mt-0.5 text-[13px] text-texto-suave">50 registros por página. Los anulados conservan su historial, pero no forman parte de los indicadores.</p>
      </header>
      {data.movimientos.length === 0
        ? <EmptyState icono={ReceiptText} titulo="Sin movimientos en este filtro" descripcion="Registre una operación o cambie el rango de fechas. No se muestran cifras de ejemplo." />
        : <div className="overflow-hidden rounded-card border border-borde bg-superficie">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="border-b border-borde bg-superficie-fila"><tr className="text-left">
              <th className="etiqueta-mono h-11 px-6 font-medium">Fecha</th>
              <th className="etiqueta-mono h-11 px-6 font-medium">Concepto</th>
              <th className="etiqueta-mono h-11 px-6 font-medium">Categoría</th>
              {mostrarTipo && <th className="etiqueta-mono h-11 px-6 font-medium">Tipo</th>}
              <th className="etiqueta-mono h-11 px-6 font-medium">Estado</th>
              <th className="etiqueta-mono h-11 px-6 text-right font-medium">Monto USD</th>
              {conAcciones && <th className="etiqueta-mono h-11 px-6 text-right font-medium">Acciones</th>}
            </tr></thead>
            <tbody className="[&_tr:last-child]:border-0">{data.movimientos.map((m) => <MovementRow key={`${m.tipo}-${m.id}`}
              movimiento={m} categoriaCodigo={codigos.get(m.categoria_id)} anuladoEn={formatearFechaHora(m.anulado_en)}
              mostrarTipo={mostrarTipo} puedeAnular={movimiento && m.estado === "vigente"} conAcciones={conAcciones} accion={accion} />)}</tbody>
          </table></div>
          <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-4 border-t border-borde px-6 py-4 text-[13px] text-texto-suave">
            <span>Página {data.pagina} · {data.total} {data.total === 1 ? "registro" : "registros"}</span>
            <div className="flex items-center gap-2">
              {data.pagina > 1
                ? <Link aria-label="Página anterior" className={ENLACE_PAGINA} href={paginar(data.pagina - 1)}><ChevronLeft aria-hidden="true" className="size-4" /></Link>
                : <span aria-hidden="true" className={PAGINA_INACTIVA}><ChevronLeft className="size-4" /></span>}
              <span aria-current="page" className="flex size-9 items-center justify-center rounded-full bg-primario text-[13px] font-medium text-white">{data.pagina}</span>
              {data.pagina < totalPaginas
                ? <Link aria-label="Página siguiente" className={ENLACE_PAGINA} href={paginar(data.pagina + 1)}><ChevronRight aria-hidden="true" className="size-4" /></Link>
                : <span aria-hidden="true" className={PAGINA_INACTIVA}><ChevronRight className="size-4" /></span>}
            </div>
          </nav>
        </div>}
    </section>
    <Banner tono="info">El resultado operativo no equivale automáticamente a utilidad contable ni a saldo bancario.</Banner>
  </div>;
}
