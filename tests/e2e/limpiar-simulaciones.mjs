import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

/** Clean up only the exact simulated resources tracked by this test run. */
export async function limpiarSimulaciones(env, { movimientos = [], usuarios = [], categorias = [] }) {
  if (movimientos.length + usuarios.length + categorias.length === 0) return;
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname));
  const cliente = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: acceso } = await cliente.auth.signInWithPassword({ email: "admin@carlitos.local", password: env.DEMO_USER_PASSWORD });
  assert.equal(acceso, null, "Cleanup requires an authorized local session");
  for (const { tipo, concepto } of movimientos) {
    assert.ok(concepto.startsWith("E2E SIMULADO "));
    const { data, error } = await cliente.from("v_movimientos").select("id,revision,estado")
      .eq("tipo", tipo).eq("concepto", concepto).maybeSingle();
    assert.equal(error, null);
    if (data?.estado === "vigente") {
      const resultado = await cliente.rpc("anf_anular_movimiento", {
        p_tipo: tipo, p_id: data.id, p_revision: data.revision, p_motivo: "Cierre E2E SIMULADO de verificación",
      });
      assert.equal(resultado.error, null);
    }
  }
  for (const id of usuarios) {
    const { data, error } = await cliente.from("perfiles").select("nombre,rol,activo,actualizado_en").eq("usuario_id", id).maybeSingle();
    assert.equal(error, null);
    if (data?.activo) {
      assert.ok(data.nombre.startsWith("E2E SIMULADO usuario "));
      const resultado = await cliente.rpc("anf_guardar_perfil", {
        p_id: id, p_version: data.actualizado_en, p_nombre: data.nombre, p_rol: data.rol, p_activo: false,
      });
      assert.equal(resultado.error, null);
    }
  }
  for (const { codigo, nombre } of categorias) {
    assert.ok(nombre.startsWith("E2E SIMULADO categoría "));
    const { data, error } = await cliente.from("categorias").select("*").eq("codigo", codigo).eq("nombre", nombre).maybeSingle();
    assert.equal(error, null);
    if (data?.activo) {
      const resultado = await cliente.rpc("anf_guardar_categoria", {
        p_id: data.id, p_version: data.actualizado_en, p_codigo: data.codigo, p_nombre: data.nombre,
        p_tipo: data.tipo, p_descripcion: data.descripcion, p_activo: false,
      });
      assert.equal(resultado.error, null);
    }
  }
  await cliente.auth.signOut({ scope: "local" });
}
