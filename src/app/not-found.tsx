import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/atoms/button";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo px-4">
      <div className="w-full max-w-md rounded-card border border-borde bg-superficie p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-superficie-tenue text-texto-2">
          <Compass aria-hidden="true" className="size-5" />
        </span>
        <p className="etiqueta-mono mt-4 text-[11px]">Error 404</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-[-0.03em] text-texto">Ruta no encontrada</h1>
        <p className="mt-2 text-sm leading-relaxed text-texto-suave">
          La dirección solicitada no existe o el recurso no está disponible
          para tu contexto.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden="true" />
            Volver al panel financiero
          </Link>
        </Button>
      </div>
    </main>
  );
}
