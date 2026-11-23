import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { guiasAdministracion, guiasFinancieras } from "@/config/guias";
import { WorkflowGuide } from "@/components/organisms/workflow-guide";

describe("Guías contextuales", () => {
  it("ofrece tres pasos concretos en cada módulo, sin enlaces externos", () => {
    for (const guia of [...Object.values(guiasFinancieras), ...Object.values(guiasAdministracion)]) {
      expect(guia.pasos).toHaveLength(3);
      for (const paso of guia.pasos) {
        expect(paso.titulo.length).toBeGreaterThan(3);
        expect(paso.descripcion.length).toBeGreaterThan(20);
        if ("href" in paso && paso.href) expect(paso.href).toMatch(/^[\/#]/);
      }
    }
  });

  it("el empleado recibe ayuda de consulta, sin acciones administrativas", () => {
    const guia = guiasAdministracion.categoriasConsulta;
    expect(JSON.stringify(guia)).not.toContain("nueva-categoria");
    expect(guia.pasos[2].href).toBe("/ingresos");
  });

  it("está cerrada al inicio, permite saltar entre pasos y no bloquea la pantalla", () => {
    const html = renderToStaticMarkup(createElement(WorkflowGuide, { guia: guiasFinancieras.ingreso }));
    expect(html).toContain("Guía paso a paso");
    expect(html).toContain("Paso 1 de 3");
    expect(html).toContain('aria-current="step"');
    expect(html).not.toContain("<dialog");
    expect(html).not.toMatch(/<details[^>]*\sopen(?:\s|=|>)/);
  });
});
