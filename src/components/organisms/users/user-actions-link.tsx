import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/atoms/button";
import { rutas } from "@/config/rutas";
import type { PerfilAdministrado } from "@/types/finanzas";

export function UserActionsLink({ usuario, seguridad = false }: {
  usuario: PerfilAdministrado;
  seguridad?: boolean;
}) {
  return <Link href={seguridad ? rutas.seguridadUsuario(usuario.usuario_id) : rutas.usuarios.detalle(usuario.usuario_id)}
    aria-label={`${seguridad ? "Ver seguridad de" : "Gestionar"} ${usuario.nombre}`}
    className={buttonVariants({ variant: "secondary", size: "sm" })}>
    {seguridad ? "Ver detalle y actividad" : "Gestionar"}<ArrowUpRight aria-hidden="true" />
  </Link>;
}
