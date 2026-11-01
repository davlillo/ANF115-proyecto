"use client";

import { Eye, EyeOff, Info, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { rutas } from "@/config/rutas";
import { useActionState, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Banner } from "@/components/molecules/banner";
import { FormField } from "@/components/molecules/form-field";
import { ValidationSummary } from "@/components/molecules/validation-summary";
import {
  ESTADO_FORMULARIO_INICIAL,
  type EstadoFormulario,
} from "@/types/formularios";

type LoginFormProps = {
  accion: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
};

export function LoginForm({ accion }: LoginFormProps) {
  const [estado, enviar, pendiente] = useActionState(
    accion,
    ESTADO_FORMULARIO_INICIAL,
  );
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const IconoOjo = mostrarContrasena ? EyeOff : Eye;

  return (
    <form action={enviar} className="space-y-5" noValidate>
      {estado.estado === "error" ? (
        <ValidationSummary
          errores={estado.campos ?? []}
          mensajeExito={undefined}
          className="text-xs"
        />
      ) : null}

      {estado.estado === "error" && (!estado.campos || estado.campos.length === 0) ? (
        <Banner tono="danger" role="alert">
          {estado.mensaje ?? "No se pudo iniciar sesión."}
        </Banner>
      ) : null}

      <FormField
        id="correo"
        etiqueta="Correo electrónico"
        ayuda="El correo asociado a tu cuenta. El perfil debe estar activo."
        requerido
      >
        <Input
          id="correo"
          name="correo"
          type="email"
          icono={Mail}
          autoComplete="username"
          placeholder="nombre@carlitos.local"
          required
          aria-describedby="correo-ayuda"
          className="h-11"
        />
      </FormField>

      <FormField
        id="contrasena"
        etiqueta="Contraseña"
        ayuda="Usa la contraseña asignada a tu cuenta."
        requerido
        accesorio={
          <Link href={rutas.recuperarAcceso} className="text-[13px] text-acento hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        }
      >
        <Input
          id="contrasena"
          name="contrasena"
          type={mostrarContrasena ? "text" : "password"}
          icono={Lock}
          autoComplete="current-password"
          placeholder="********"
          required
          className="h-11"
          sufijo={
            <button
              type="button"
              onClick={() => setMostrarContrasena((actual) => !actual)}
              aria-pressed={mostrarContrasena}
              aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="flex size-8 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-superficie-tenue hover:text-texto"
            >
              <IconoOjo aria-hidden="true" className="size-4" />
            </button>
          }
        />
      </FormField>

      <Button type="submit" size="lg" disabled={pendiente} className="w-full">
        <LogIn aria-hidden="true" />
        {pendiente ? "Ingresando..." : "Entrar al sistema"}
      </Button>

      <div className="flex items-start gap-2.5 rounded-input bg-superficie-tenue px-4 py-3 text-xs leading-relaxed text-texto-suave">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Acceso local con Supabase. Si no tienes credenciales de prueba,
          solicítalas al responsable del entorno. No se muestran contraseñas
          en esta pantalla.
        </p>
      </div>
    </form>
  );
}
