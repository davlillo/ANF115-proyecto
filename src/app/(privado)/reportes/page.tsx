import { connection } from "next/server";
import { consultarFinanzas } from "@/controladores/finanzas.controller";
import { FinanceWorkspace } from "@/components/organisms/finance-workspace";
import { OperationError } from "@/components/molecules/operation-error";
import { PERMISOS } from "@/config/permisos";
import { guardarOperacion } from "../operaciones";

export const metadata = { title: "Reportes" };
export const instant = false;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const r = await consultarFinanzas(await searchParams, undefined, PERMISOS.panelLeer);
  return r.ok ? <FinanceWorkspace data={r.datos} modulo="reportes" accion={guardarOperacion} /> : <OperationError mensaje={r.error.mensaje} />;
}
