import { connection } from "next/server";
import { CircleCheck, Mail, ShieldCheck, User, UserRound } from "lucide-react";
import { Avatar } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { Banner } from "@/components/molecules/banner";
import { OperationError } from "@/components/molecules/operation-error";
import { PageHeader } from "@/components/molecules/page-header";
import { consultarAdministracion } from "@/controladores/finanzas.controller";

export const metadata = { title: "Mi perfil" };
export const instant = false;

const FILA = "grid items-center gap-2 rounded-input border border-borde bg-superficie-fila p-4 sm:grid-cols-[180px_1fr]";
const ETIQUETA = "etiqueta-mono flex items-center gap-2";

export default async function Page() {
  await connection();
  const r = await consultarAdministracion("perfil");
  if (!r.ok) return <OperationError mensaje={r.error.mensaje} />;
  const perfil = r.datos.perfil;
  const administrador = perfil.rol === "administrador";
  const rol = administrador ? "Administrador" : "Empleado";
  return <div className="space-y-6">
    <PageHeader eyebrow="Cuenta · Acceso" titulo="Mi perfil" descripcion="Información personal y acceso al sistema." />
    <section className="grid overflow-hidden rounded-card border border-borde bg-superficie lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col items-center justify-center border-b border-borde p-8 text-center lg:border-b-0 lg:border-r">
        <Avatar nombre={perfil.nombre} className="size-24 text-3xl font-medium" />
        <h2 className="mt-5 text-[22px] font-medium tracking-[-0.02em]">{perfil.nombre}</h2>
        <div className="mt-7 w-full border-t border-borde pt-5 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold text-exito"><CircleCheck aria-hidden="true" className="size-4" />Cuenta activa</p>
          <p className="mt-1 pl-6 text-xs text-texto-suave">Puedes acceder al sistema con normalidad.</p>
        </div>
      </div>
      <div className="space-y-4 p-6 sm:p-8">
        <dl className="space-y-3 text-sm">
          <div className={FILA}><dt className={ETIQUETA}><UserRound aria-hidden="true" className="size-4" />Nombre</dt><dd className="font-medium">{perfil.nombre}</dd></div>
          <div className={FILA}><dt className={ETIQUETA}><Mail aria-hidden="true" className="size-4" />Correo electrónico</dt><dd className="break-all font-medium">{r.datos.correoPerfil}</dd></div>
          <div className={FILA}><dt className={ETIQUETA}><ShieldCheck aria-hidden="true" className="size-4" />Rol</dt><dd><Badge variant={administrador ? "info" : "neutral"}>{administrador ? <ShieldCheck aria-hidden="true" /> : <User aria-hidden="true" />}{rol}</Badge></dd></div>
        </dl>
        <Banner tono="info" className="p-4">
          <h3 className="font-semibold">Administración del perfil</h3>
          <p className="mt-1 text-xs leading-relaxed">Un administrador puede registrar o modificar tu nombre y asignar el rol autorizado. No puedes elevar tus propios permisos.</p>
        </Banner>
      </div>
    </section>
  </div>;
}
