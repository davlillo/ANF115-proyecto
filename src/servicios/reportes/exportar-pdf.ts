import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatearUSD } from "@/lib/dinero";
import { ETIQUETA_GRANULARIDAD, type DatosReporte } from "./tipos";

const MARGEN = 14;
const COLOR_ENCABEZADO: [number, number, number] = [91, 58, 41];
const COLOR_TEXTO: [number, number, number] = [40, 30, 25];
const COLOR_SUAVE: [number, number, number] = [120, 110, 105];

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? MARGEN;
}

function seccion(doc: jsPDF, texto: string, y: number): number {
  const alto = doc.internal.pageSize.getHeight();
  if (y > alto - 40) {
    doc.addPage();
    y = MARGEN + 4;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text(texto, MARGEN, y);
  return y + 3;
}

function nota(doc: jsPDF, texto: string, y: number): number {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SUAVE);
  doc.text(texto, MARGEN, y + 5);
  return y + 10;
}

const estiloBase = {
  styles: { font: "helvetica", fontSize: 9, cellPadding: 2, textColor: COLOR_TEXTO },
  headStyles: { fillColor: COLOR_ENCABEZADO, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const },
  margin: { left: MARGEN, right: MARGEN },
};

export function exportarPdf(datos: DatosReporte): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ancho = doc.internal.pageSize.getWidth();

  /* ---------- Encabezado ---------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...COLOR_TEXTO);
  doc.text("Panadería Carlitos - Reporte financiero", MARGEN, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_SUAVE);
  doc.text("Datos académicos simulados. Importes en USD.", MARGEN, 24);

  autoTable(doc, {
    ...estiloBase,
    startY: 28,
    theme: "plain",
    body: [
      ["Período", `${datos.filtro.desde} a ${datos.filtro.hasta}`],
      ["Categoría", datos.categoriaNombre ?? "Todas las categorías"],
      ["Tipo", datos.filtro.tipo ?? "Ingresos y gastos"],
      ["Agrupación", ETIQUETA_GRANULARIDAD[datos.filtro.granularidad]],
      ["Generado por", datos.generadoPor],
      ["Generado el", datos.generadoEn],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 } },
  });

  /* ---------- Indicadores ---------- */
  let y = seccion(doc, "Indicadores", finalY(doc) + 8);
  autoTable(doc, {
    ...estiloBase,
    startY: y,
    head: [["Indicador", "Valor"]],
    body: [
      ["Ingresos totales", formatearUSD(datos.resumen.ingresos)],
      ["Gastos totales", formatearUSD(datos.resumen.gastos)],
      ["Resultado financiero", formatearUSD(datos.resumen.resultado)],
      ["Porcentaje de gastos", datos.resumen.porcentaje_gastos === null ? "No aplica" : `${datos.resumen.porcentaje_gastos} %`],
      ["Movimientos vigentes", String(datos.resumen.cantidad)],
    ],
    columnStyles: { 1: { halign: "right" } },
  });
  y = nota(doc, "Los totales excluyen movimientos anulados.", finalY(doc));

  /* ---------- Por período ---------- */
  y = seccion(doc, `Resumen ${ETIQUETA_GRANULARIDAD[datos.filtro.granularidad].toLowerCase()}`, y + 2);
  if (datos.periodos.length === 0) {
    y = nota(doc, "Sin datos en este filtro.", y);
  } else {
    autoTable(doc, {
      ...estiloBase,
      startY: y,
      head: [["Período", "Ingresos", "Gastos", "Resultado", "% gastos"]],
      body: datos.periodos.map((p) => [
        p.periodo,
        formatearUSD(p.ingresos),
        formatearUSD(p.gastos),
        formatearUSD(p.resultado),
        p.porcentaje_gastos === null ? "No aplica" : `${p.porcentaje_gastos} %`,
      ]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    });
    y = finalY(doc) + 8;
  }

  /* ---------- Gastos por categoría ---------- */
  y = seccion(doc, "Gastos por categoría", y);
  if (datos.distribucion.length === 0) {
    y = nota(doc, "No hay gastos vigentes en este período.", y);
  } else {
    autoTable(doc, {
      ...estiloBase,
      startY: y,
      head: [["Categoría", "Monto", "% del total"]],
      body: datos.distribucion.map((c) => [c.categoria, formatearUSD(c.monto), `${c.ancho} %`]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
    y = finalY(doc) + 8;
  }

  /* ---------- Movimientos ---------- */
  y = seccion(doc, "Detalle de movimientos", y);
  if (datos.movimientos.length === 0) {
    nota(doc, "Sin movimientos en este filtro.", y);
  } else {
    autoTable(doc, {
      ...estiloBase,
      startY: y,
      styles: { ...estiloBase.styles, fontSize: 8 },
      head: [["Fecha", "Tipo", "Concepto", "Categoría", "Estado", "Monto"]],
      body: datos.movimientos.map((m) => [m.fecha, m.tipo, m.concepto, m.categoria, m.estado, formatearUSD(m.monto)]),
      columnStyles: {
        0: { cellWidth: 21 },
        1: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { halign: "right", cellWidth: 24 },
      },
      didParseCell: (hook) => {
        if (hook.section === "body" && datos.movimientos[hook.row.index]?.estado === "anulado") {
          hook.cell.styles.textColor = COLOR_SUAVE;
          hook.cell.styles.fontStyle = "italic";
        }
      },
    });
  }

  /* ---------- Pie de página ---------- */
  const paginas = doc.getNumberOfPages();
  const alto = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_SUAVE);
    doc.text("Panadería Carlitos | Finanzas - datos académicos simulados", MARGEN, alto - 8);
    doc.text(`Página ${i} de ${paginas}`, ancho - MARGEN, alto - 8, { align: "right" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}