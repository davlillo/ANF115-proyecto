import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { OperationError } from "@/components/molecules/operation-error";
import { UserWorkspace } from "@/components/organisms/users/user-workspace";
import { consultarUsuario } from "@/controladores/finanzas.controller";
import { guardarOperacion } from "../../operaciones";

export const metadata: Metadata = {
  title: "Gestionar usuario",
};

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  await connection();
  const { id } = await params;
  const r = await consultarUsuario(id);
  if (!r.ok) {
    if (r.error.codigo === "RECURSO_NO_ENCONTRADO") notFound();
    return <OperationError mensaje={r.error.mensaje} />;
  }
  return <UserWorkspace {...r.datos} accion={guardarOperacion} />;
}
