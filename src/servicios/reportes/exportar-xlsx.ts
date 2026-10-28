import ExcelJS from "exceljs";
import { ETIQUETA_GRANULARIDAD, type DatosReporte } from "./tipos";

const FORMATO_USD = '"$"#,##0.00;[Red]-"$"#,##0.00';
const FORMATO_PORCENTAJE = '0.00"%"';
const COLOR_ENCABEZADO = "FF5B3A29";

/**
 * Los importes llegan como texto canonico con dos decimales (numeric(18,2)).
 * Excel necesita celdas numericas para poder sumar y filtrar; esta conversion
 * ocurre solo al escribir la celda. No se hacen calculos con el resultado.
 */
function aCelda(importe: string): number {
  return Number(importe);
}

function estilarEncabezado(fila: ExcelJS.Row) {
  fila.font = { bold: true, color: { argb: "FFFFFFFF" } };
  fila.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  fila.eachCell((celda) => {
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ENCABEZADO } };
  });
}

function agregarTitulo(hoja: ExcelJS.Worksheet, texto: string, columnas: number) {
  const fila = hoja.addRow([texto]);
  fila.font = { bold: true, size: 14 };
  hoja.mergeCells(fila.number, 1, fila.number, columnas);
  return fila;
}

export async function exportarXlsx(datos: DatosReporte): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Panadería Carlitos | Finanzas";
  libro.created = new Date();

  /* ---------- Resumen ---------- */
  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [{ width: 30 }, { width: 38 }];
  agregarTitulo(resumen, "Panadería Carlitos - Reporte financiero", 2);
  resumen.addRow(["Datos académicos simulados. Importes en USD."]).font = { italic: true };
  resumen.addRow([]);
  const filtros: [string, string][] = [
    ["Período", `${datos.filtro.desde} a ${datos.filtro.hasta}`],
    ["Categoría", datos.categoriaNombre ?? "Todas las categorías"],
    ["Tipo", datos.filtro.tipo ?? "Ingresos y gastos"],
    ["Agrupación", ETIQUETA_GRANULARIDAD[datos.filtro.granularidad]],
    ["Generado por", datos.generadoPor],
    ["Generado el", datos.generadoEn],
  ];
  for (const [etiqueta, valor] of filtros) {
    const fila = resumen.addRow([etiqueta, valor]);
    fila.getCell(1).font = { bold: true };
  }
  resumen.addRow([]);
  estilarEncabezado(resumen.addRow(["Indicador", "Valor"]));
  const indicadores: [string, string | number, string?][] = [
    ["Ingresos totales", aCelda(datos.resumen.ingresos), FORMATO_USD],
    ["Gastos totales", aCelda(datos.resumen.gastos), FORMATO_USD],
    ["Resultado financiero", aCelda(datos.resumen.resultado), FORMATO_USD],
    [
      "Porcentaje de gastos",
      datos.resumen.porcentaje_gastos === null ? "No aplica" : aCelda(datos.resumen.porcentaje_gastos),
      FORMATO_PORCENTAJE,
    ],
    ["Movimientos vigentes", datos.resumen.cantidad],
  ];
  for (const [etiqueta, valor, formato] of indicadores) {
    const fila = resumen.addRow([etiqueta, valor]);
    fila.getCell(2).alignment = { horizontal: "right" };
    if (formato && typeof valor === "number") fila.getCell(2).numFmt = formato;
  }
  resumen.addRow([]);
  resumen.addRow(["Los totales excluyen movimientos anulados."]).font = { italic: true };

  /* ---------- Por período ---------- */
  const periodos = libro.addWorksheet("Por período");
  periodos.columns = [
    { header: "Período", width: 16 },
    { header: "Ingresos", width: 16 },
    { header: "Gastos", width: 16 },
    { header: "Resultado", width: 16 },
    { header: "% gastos", width: 12 },
    { header: "Movimientos", width: 14 },
  ];
  estilarEncabezado(periodos.getRow(1));
  periodos.views = [{ state: "frozen", ySplit: 1 }];
  for (const p of datos.periodos) {
    const fila = periodos.addRow([
      p.periodo,
      aCelda(p.ingresos),
      aCelda(p.gastos),
      aCelda(p.resultado),
      p.porcentaje_gastos === null ? "No aplica" : aCelda(p.porcentaje_gastos),
      p.cantidad,
    ]);
    for (const col of [2, 3, 4]) fila.getCell(col).numFmt = FORMATO_USD;
    if (p.porcentaje_gastos !== null) fila.getCell(5).numFmt = FORMATO_PORCENTAJE;
    fila.getCell(5).alignment = { horizontal: "right" };
  }

  /* ---------- Gastos por categoría ---------- */
  const categorias = libro.addWorksheet("Gastos por categoría");
  categorias.columns = [
    { header: "Categoría", width: 36 },
    { header: "Monto", width: 16 },
    { header: "% del total de gastos", width: 22 },
  ];
  estilarEncabezado(categorias.getRow(1));
  categorias.views = [{ state: "frozen", ySplit: 1 }];
  for (const c of datos.distribucion) {
    const fila = categorias.addRow([c.categoria, aCelda(c.monto), aCelda(c.ancho)]);
    fila.getCell(2).numFmt = FORMATO_USD;
    fila.getCell(3).numFmt = FORMATO_PORCENTAJE;
  }

  /* ---------- Movimientos ---------- */
  const movimientos = libro.addWorksheet("Movimientos");
  movimientos.columns = [
    { header: "Fecha", width: 12 },
    { header: "Tipo", width: 10 },
    { header: "Concepto", width: 42 },
    { header: "Categoría", width: 28 },
    { header: "Referencia", width: 20 },
    { header: "Estado", width: 11 },
    { header: "Monto", width: 16 },
    { header: "Motivo de anulación", width: 36 },
  ];
  estilarEncabezado(movimientos.getRow(1));
  movimientos.views = [{ state: "frozen", ySplit: 1 }];
  for (const m of datos.movimientos) {
    const fila = movimientos.addRow([
      m.fecha,
      m.tipo,
      m.concepto,
      m.categoria,
      m.referencia ?? "",
      m.estado,
      aCelda(m.monto),
      m.motivo_anulacion ?? "",
    ]);
    fila.getCell(7).numFmt = FORMATO_USD;
    if (m.estado === "anulado") fila.font = { color: { argb: "FF8A8A8A" }, italic: true };
  }
  if (datos.movimientos.length > 0) {
    movimientos.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };
  }

  return new Uint8Array(await libro.xlsx.writeBuffer());
}