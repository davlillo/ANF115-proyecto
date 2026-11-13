import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonVariants } from "@/components/atoms/button";
import { OperationError } from "@/components/molecules/operation-error";
import { UserWorkspace } from "@/components/organisms/users/user-workspace";
import { consultarUsuario } from "@/controladores/finanzas.controller";
import { guardarOperacion } from "@/app/(privado)/operaciones";

export const metadata = { title: "Seguridad de usuario" };
export const instant = false;

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  await connection();
  const { id } = await params;
  const q = await searchParams;
  const pagina = typeof q.pagina === "string" && /^\d{1,6}$/.test(q.pagina) ? Math.max(1, Number(q.pagina)) : 1;
  const r = await consultarUsuario(id, true, pagina);
  if (!r.ok) {
    if (r.error.codigo === "RECURSO_NO_ENCONTRADO") notFound();
    return <OperationError mensaje={r.error.mensaje} />;
  }
  return <><UserWorkspace {...r.datos} accion={guardarOperacion} seguridad />
    <nav aria-label="Páginas de actividad" className="mt-5 flex items-center justify-between gap-3 text-sm text-texto-suave">
      {pagina > 1 ? <Link href={`?pagina=${pagina - 1}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Anterior</Link> : <span />}
      <span>Página {pagina} · {r.datos.total} eventos</span>
      {pagina * 50 < r.datos.total ? <Link href={`?pagina=${pagina + 1}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Siguiente</Link> : <span />}
    </nav>
  </>;
}
