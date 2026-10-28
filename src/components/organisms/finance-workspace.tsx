import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleMinus,
  Clock3,
  FileText,
  ReceiptText,
  Settings2,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { formatearUSD } from "@/lib/dinero";
import { rutas } from "@/config/rutas";
import { Badge } from "@/components/atoms/badge";
import { OperationForm } from "@/components/organisms/operation-form";
import { FinanceFilters } from "@/components/molecules/finance-filters";
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

export function FinanceWorkspace({ data, modulo, accion }: {
  data: VistaFinanciera; modulo: "panel" | "ingreso" | "gasto" | "reportes"; accion: AccionOperacion;
}) {
  const movimiento = modulo === "ingreso" || modulo === "gasto";
  const titulo = modulo === "panel" ? "Panel financiero" : modulo === "reportes" ? "Reportes" : modulo === "ingreso" ? "Ingresos" : "Gastos";
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
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-primario">Panadería Carlitos · Control operativo</p>
        <h1 className="mt-2 font-serif text-4xl">{titulo}</h1>
        <p className="mt-2 text-sm text-texto-suave">Cobros y pagos · {data.perfil.rol === "empleado" ? "Solo tus movimientos" : "Todos los movimientos autorizados"} · Datos simulados</p></div>
        {modulo === "reportes" && <div className="flex flex-wrap gap-2">
        <a href={descargar("pdf")} download className="rounded-input border border-borde-fuerte bg-superficie px-5 py-2.5 text-sm font-semibold">Descargar PDF</a>
        <a href={descargar("xlsx")} download className="rounded-input bg-primario px-5 py-2.5 text-sm font-semibold text-white">Descargar Excel</a>
      </div>}
      {movimiento && <a href="#nueva-captura" className="rounded-input bg-primario px-5 py-2.5 text-sm font-semibold text-white">Registrar {modulo}</a>}
    </header>
    <FinanceFilters filtro={data.filtro} categorias={data.categorias} reportes={modulo === "reportes"} />
    <p className="text-sm text-texto-suave">Período: <strong>{data.filtro.desde} — {data.filtro.hasta}</strong>. El estado filtra el detalle; los indicadores siempre excluyen anulados.</p>
    <section aria-label="Indicadores financieros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Ingresos totales", formatearUSD(data.resumen.ingresos), "text-exito"],
        ["Gastos totales", formatearUSD(data.resumen.gastos), "text-peligro"],
        ["Resultado financiero", formatearUSD(data.resumen.resultado), data.resumen.resultado.startsWith("-") ? "text-peligro" : "text-texto"],
        ["Porcentaje de gastos", data.resumen.porcentaje_gastos === null ? "No aplica" : `${data.resumen.porcentaje_gastos} %`, "text-texto"],
      ].map(([label, value, color]) => <article key={label} className="rounded-card border border-borde bg-superficie p-5 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{label}</h2><p className={`mt-3 text-right text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      </article>)}
    </section>
    {modulo === "panel" && <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-card border border-borde bg-superficie p-6"><h2 className="font-serif text-xl">Ingresos y gastos</h2>
        {(["ingresos", "gastos"] as const).map((tipo) => <div key={tipo} className="mt-5"><div className="mb-2 flex justify-between text-sm"><span>{tipo === "ingresos" ? "Ingresos" : "Gastos"}</span><span>{formatearUSD(data.resumen[tipo])}</span></div>
          <div className="h-5 overflow-hidden rounded-input bg-superficie-tenue"><div className={`h-full ${tipo === "ingresos" ? "bg-exito" : "bg-peligro"}`} style={{ width: `${data.barras[tipo]}%` }} /></div></div>)}
      </section>
      <section className="rounded-card border border-borde bg-superficie p-6"><h2 className="font-serif text-xl">Distribución de gastos</h2>
        {data.distribucion.length === 0 && <p className="mt-4 text-sm text-texto-suave">No hay gastos vigentes en este período.</p>}
        {data.distribucion.map((c) => <div key={c.categoria} className="mt-4"><div className="flex justify-between gap-3 text-xs"><span>{c.categoria}</span><span>{formatearUSD(c.monto)} · {c.ancho}%</span></div>
          <div className="mt-2 h-2 rounded bg-superficie-tenue"><div className="h-full rounded bg-primario" style={{ width: `${c.ancho}%` }} /></div></div>)}
      </section>
    </div>}
    {movimiento && <section id="nueva-captura" className="scroll-mt-24 rounded-card border border-borde bg-superficie p-6 shadow-card sm:p-7">
      <header className="mb-7 flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primario/10 text-primario">
          <Banknote aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h2 className="font-serif text-3xl">Registrar {modulo}</h2>
          <p className="mt-1 text-sm text-texto-suave">Completa la información del {modulo} que deseas registrar en el sistema.</p>
        </div>
      </header>
      <OperationForm accion={accion} operacion="movimiento" ocultos={{ tipo: modulo }} solicitud={crypto.randomUUID()}
        campos={camposMovimiento(data, modulo)} texto={`Guardar ${modulo}`} presentacion="movimiento" />
    </section>}
    {modulo === "reportes" && <section className="rounded-card border border-borde bg-superficie p-5">
      <h2 className="mb-4 font-serif text-xl">Resumen {data.filtro.granularidad === "dia" ? "diario" : data.filtro.granularidad === "mes" ? "mensual" : "anual"}</h2>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-borde text-left"><th className="p-3">Período</th><th className="p-3 text-right">Ingresos</th><th className="p-3 text-right">Gastos</th><th className="p-3 text-right">Resultado</th><th className="p-3 text-right">% gastos</th></tr></thead>
        <tbody>{data.periodos.map((p) => <tr key={p.periodo} className="border-b border-borde"><td className="p-3">{p.periodo}</td><td className="p-3 text-right tabular-nums">{formatearUSD(p.ingresos)}</td><td className="p-3 text-right tabular-nums">{formatearUSD(p.gastos)}</td><td className="p-3 text-right tabular-nums">{formatearUSD(p.resultado)}</td><td className="p-3 text-right">{p.porcentaje_gastos === null ? "No aplica" : `${p.porcentaje_gastos}%`}</td></tr>)}</tbody></table></div>
    </section>}
    <section className="rounded-card border border-borde bg-superficie p-5 shadow-card sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primario/10 text-primario">
          <ReceiptText aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-2xl">Detalle de movimientos</h2>
          <p className="mt-1 text-sm text-texto-suave">50 registros por página. Los anulados conservan su historial, pero no forman parte de los indicadores.</p>
        </div>
      </header>
      {data.movimientos.length === 0 ? <div className="mt-5 rounded-input bg-superficie-tenue p-8 text-center"><h3 className="font-serif text-xl">Sin movimientos en este filtro</h3><p className="mt-2 text-sm">Registre una operación o cambie el rango de fechas. No se muestran cifras de ejemplo.</p></div>
        : <div className="mt-5 overflow-x-auto rounded-input border border-borde"><table className="w-full text-sm">
          <thead className="bg-superficie-tenue text-texto-suave"><tr className="border-b border-borde text-left">
            <th className="whitespace-nowrap px-4 py-3 font-semibold"><span className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" />Fecha</span></th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold"><span className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4" />Concepto</span></th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold"><span className="flex items-center gap-2"><Tag aria-hidden="true" className="size-4" />Categoría</span></th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold"><span className="flex items-center gap-2"><Banknote aria-hidden="true" className="size-4" />Tipo / estado</span></th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-semibold"><span className="flex items-center justify-end gap-2"><Banknote aria-hidden="true" className="size-4" />Monto USD</span></th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold"><span className="flex items-center gap-2"><Settings2 aria-hidden="true" className="size-4" />Acciones</span></th>
          </tr></thead>
          <tbody>{data.movimientos.map((m) => <Fragment key={`${m.tipo}-${m.id}`}>
            <tr className={`border-b border-borde/70 align-middle hover:bg-crema-100/50 ${m.estado === "anulado" ? "bg-peligro/5" : ""}`}>
              <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums">{m.fecha}</td>
              <td className="min-w-44 px-4 py-4 font-medium">{m.concepto}{m.referencia && <small className="mt-1 block font-normal text-texto-suave">{m.referencia}</small>}</td>
              <td className="px-4 py-4"><Badge variant="primary">{m.categoria}</Badge></td>
              <td className="px-4 py-4"><div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={m.tipo === "ingreso" ? "success" : "danger"}>
                  {m.tipo === "ingreso" ? <ArrowUp aria-hidden="true" className="size-3.5" /> : <ArrowDown aria-hidden="true" className="size-3.5" />}
                  {m.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                </Badge>
                <Badge variant={m.estado === "vigente" ? "neutral" : "danger"}><CircleMinus aria-hidden="true" className="size-3.5" />{m.estado === "vigente" ? "Vigente" : "Anulado"}</Badge>
              </div></td>
              <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">{formatearUSD(m.monto)}</td>
              <td className="min-w-52 px-4 py-4">{movimiento && m.estado === "vigente" ? <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-input border border-peligro/20 bg-peligro/10 px-4 py-2 font-semibold text-peligro transition-colors hover:bg-peligro/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro [&::-webkit-details-marker]:hidden">
                  <Trash2 aria-hidden="true" className="size-4" />Anular
                </summary>
                <div className="mt-3 min-w-72 rounded-input border border-borde bg-superficie p-4 shadow-card">
                  <p className="mb-3 text-xs text-texto-suave">Acción definitiva. El movimiento se conserva y deja de contar en los totales.</p>
                  <OperationForm accion={accion} operacion="anular" ocultos={{ tipo: m.tipo, id: m.id, revision: String(m.revision) }}
                    campos={[{ nombre: "motivo", etiqueta: "Motivo de anulación (mínimo 5 caracteres)", requerido: true, tipo: "textarea", maxLength: 500 }]} texto="Confirmar anulación" />
                </div>
              </details> : <span aria-label="Sin acciones disponibles" className="text-texto-suave">—</span>}</td>
            </tr>
            {m.estado === "anulado" && <tr className="border-b border-peligro/20 bg-peligro/5">
              <td colSpan={6} className="px-4 pb-4">
                <details className="group rounded-input border border-peligro/15 bg-superficie/70 text-xs">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-peligro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peligro [&::-webkit-details-marker]:hidden">
                    <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
                    <span>Movimiento anulado</span>
                    <span className="ml-auto font-medium text-texto-suave">Ver detalle</span>
                    <ChevronDown aria-hidden="true" className="size-4 text-texto-suave transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid gap-4 border-t border-peligro/10 px-4 py-4 sm:grid-cols-3">
                    <p className="leading-relaxed text-texto">{m.motivo_anulacion}</p>
                    <div className="flex gap-2"><UserRound aria-hidden="true" className="size-4 shrink-0 text-texto-suave" /><div><p className="text-texto-suave">Anulado por</p><p className="mt-1 font-medium">{m.anulador ?? "Usuario autorizado"}</p></div></div>
                    <div className="flex gap-2"><Clock3 aria-hidden="true" className="size-4 shrink-0 text-texto-suave" /><div><p className="text-texto-suave">Fecha de anulación</p><p className="mt-1 font-medium tabular-nums">{formatearFechaHora(m.anulado_en)}</p></div></div>
                  </div>
                </details>
              </td>
            </tr>}
          </Fragment>)}</tbody>
        </table></div>}
      <nav aria-label="Paginación" className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-texto-suave">
        <span>Página {data.pagina} · {data.total} {data.total === 1 ? "registro" : "registros"}</span>
        <div className="flex items-center gap-2">
          {data.pagina > 1
            ? <Link aria-label="Página anterior" className="flex size-9 items-center justify-center rounded-input border border-borde bg-superficie hover:bg-superficie-tenue" href={paginar(data.pagina - 1)}><ChevronLeft aria-hidden="true" className="size-4" /></Link>
            : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-input border border-borde bg-superficie-tenue opacity-50"><ChevronLeft className="size-4" /></span>}
          <span aria-current="page" className="flex size-9 items-center justify-center rounded-input bg-primario/10 font-semibold text-primario">{data.pagina}</span>
          {data.pagina < totalPaginas
            ? <Link aria-label="Página siguiente" className="flex size-9 items-center justify-center rounded-input border border-borde bg-superficie hover:bg-superficie-tenue" href={paginar(data.pagina + 1)}><ChevronRight aria-hidden="true" className="size-4" /></Link>
            : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-input border border-borde bg-superficie-tenue opacity-50"><ChevronRight className="size-4" /></span>}
        </div>
      </nav>
    </section>
    <p className="text-xs text-texto-suave">El resultado operativo no equivale automáticamente a utilidad contable ni a saldo bancario.</p>
  </div>;
}
