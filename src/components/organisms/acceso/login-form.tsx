"use client";

import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { rutas } from "@/config/rutas";
import { useActionState, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Banner } from "@/components/molecules/banner";
import { FormField } from "@/components/molecules/form-field";
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
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const errorCorreo = estado.campos?.find((campo) => campo.ruta === "correo")?.mensaje;
  const errorContrasena = estado.campos?.find((campo) => campo.ruta === "contrasena")?.mensaje;
  const IconoOjo = mostrarContrasena ? EyeOff : Eye;

  return (
    <form action={enviar} className="space-y-5">
      {estado.estado === "error" && (!estado.campos || estado.campos.length === 0) ? (
        <Banner tono="danger" role="alert">
          {estado.mensaje ?? "No se pudo iniciar sesión."}
        </Banner>
      ) : null}

      <FormField
        id="correo"
        etiqueta="Correo electrónico"
        error={errorCorreo}
        requerido
      >
        <Input
          id="correo"
          name="correo"
          type="email"
          icono={Mail}
          autoComplete="username"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={pendiente}
          placeholder="nombre@carlitos.local"
          required
          aria-invalid={!!errorCorreo}
          aria-describedby={errorCorreo ? "correo-error" : undefined}
          className="h-11"
        />
      </FormField>

      <FormField
        id="contrasena"
        etiqueta="Contraseña"
        error={errorContrasena}
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
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          disabled={pendiente}
          aria-invalid={!!errorContrasena}
          aria-describedby={errorContrasena ? "contrasena-error" : undefined}
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

    </form>
  );
}
