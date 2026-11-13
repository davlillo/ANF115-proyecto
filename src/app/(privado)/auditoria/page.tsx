import { connection } from "next/server";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/atoms/button";
import { consultarAdministracion } from "@/controladores/finanzas.controller";
import { AdministrationWorkspace } from "@/components/organisms/administration-workspace";
import { OperationError } from "@/components/molecules/operation-error";
import { guardarOperacion } from "../operaciones";

export const metadata = { title: "Seguridad y bitácora" };
export const instant = false;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const pagina = typeof q.pagina === "string" && /^\d{1,6}$/.test(q.pagina) ? Math.max(1, Number(q.pagina)) : 1;
  const vista = q.vista === "bitacora" ? "bitacora" : "usuarios";
  const buscar = typeof q.buscar === "string" ? q.buscar.trim().slice(0, 120) : undefined;
  const rol = q.rol === "administrador" || q.rol === "empleado" ? q.rol : undefined;
  const activo = q.estado === "activo" ? true : q.estado === "inactivo" ? false : undefined;
  const r = await consultarAdministracion("bitacora", pagina, undefined, undefined, { buscar, rol, activo }, vista);
  if (!r.ok) return <OperationError mensaje={r.error.mensaje} />;
  const paginaUrl = (destino: number) => {
    const parametros = new URLSearchParams({ pagina: String(destino), vista });
    if (buscar) parametros.set("buscar", buscar);
    if (rol) parametros.set("rol", rol);
    if (activo !== undefined) parametros.set("estado", activo ? "activo" : "inactivo");
    return `?${parametros}`;
  };
  return <><AdministrationWorkspace modulo="bitacora" {...r.datos} accion={guardarOperacion} />
    <nav className="mt-5 flex items-center justify-between gap-3 text-[13px] text-texto-suave" aria-label="Páginas de bitácora">
      {pagina > 1 ? <Link href={paginaUrl(pagina - 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}><ChevronLeft aria-hidden="true" />Anterior</Link> : <span />}
      <span>Página {pagina} · {r.datos.total} {vista === "usuarios" ? "usuarios" : "eventos"}</span>
      {pagina * 50 < r.datos.total ? <Link href={paginaUrl(pagina + 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Siguiente<ChevronRight aria-hidden="true" /></Link> : <span />}
    </nav></>;
}
