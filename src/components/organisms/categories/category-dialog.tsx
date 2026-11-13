"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/atoms/dialog";
import { OperationForm } from "@/components/organisms/operation-form";
import type { AccionOperacion, CampoOperacion, Categoria } from "@/types/finanzas";

export function CategoryDialog({ categoria, accion }: { categoria?: Categoria; accion: AccionOperacion }) {
  const [abierto, setAbierto] = useState(false);
  const campos: CampoOperacion[] = [
    { nombre: "codigo", etiqueta: "Código (I01 / G01)", valor: categoria?.codigo, requerido: true },
    { nombre: "nombre", etiqueta: "Nombre", valor: categoria?.nombre, requerido: true, maxLength: 100 },
    { nombre: "tipo", etiqueta: "Tipo", tipo: "select", valor: categoria?.tipo ?? "ingreso",
      opciones: [{ valor: "ingreso", etiqueta: "Ingreso" }, { valor: "gasto", etiqueta: "Gasto" }] },
    { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", valor: categoria?.descripcion, maxLength: 500 },
  ];
  return <Dialog open={abierto} onOpenChange={setAbierto}>
    <DialogTrigger asChild><Button variant={categoria ? "ghost" : "primary"} size={categoria ? "sm" : "md"}>
      {categoria ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}{categoria ? "Editar" : "Nueva categoría"}
    </Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>{categoria ? `Editar ${categoria.nombre}` : "Nueva categoría"}</DialogTitle>
        <DialogDescription>{categoria ? "El código y tipo se conservan si la categoría ya tiene movimientos." : "Crea una categoría de ingreso o gasto."}</DialogDescription>
      </DialogHeader>
      <DialogBody><OperationForm accion={accion} operacion="categoria"
        ocultos={categoria ? { id: categoria.id, versionEsperada: categoria.actualizado_en, activo: String(categoria.activo) } : { activo: "true" }}
        campos={campos} texto={categoria ? "Guardar cambios" : "Crear categoría"} requiereCambios={!!categoria}
        alConfirmar={() => setAbierto(false)} />
      </DialogBody>
    </DialogContent>
  </Dialog>;
}
