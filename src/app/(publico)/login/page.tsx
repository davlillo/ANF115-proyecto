import type { Metadata } from "next";
import { LoginForm } from "@/components/organisms/acceso/login-form";
import { AuthTemplate } from "@/components/templates/auth-template";
import { iniciarSesionAction } from "./actions";

export const metadata: Metadata = {
  title: "Acceso",
};

export default function LoginPage() {
  return (
    <AuthTemplate
      titulo="Inicia sesión"
      descripcion="Ingresa con tu cuenta para administrar los ingresos y gastos de la panadería."
    >
      <LoginForm accion={iniciarSesionAction} />
    </AuthTemplate>
  );
}
