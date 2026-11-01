"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";

export default function ErrorPrivado({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg rounded-card border border-peligro/40 bg-superficie p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-peligro-tinte text-peligro">
          <TriangleAlert aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-texto">No se pudo cargar la pantalla</h1>
          <p className="text-sm leading-relaxed text-texto-suave">
            Ocurrió un error inesperado. Si el problema continúa, informa el
            identificador de la solicitud.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-texto-suave">
              Solicitud: {error.digest}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Ir al panel financiero
        </Button>
      </div>
    </div>
  );
}
