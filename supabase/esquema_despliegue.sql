-- Carlitos Finanzas - esquema final de Supabase (siete modulos)
--
-- Generado desde la base local con las diez migraciones aplicadas.
-- Migraciones autoritativas: supabase/migrations/*.sql
--
-- Uso: ejecutar UNA vez como rol postgres sobre una base que todavia no
-- contiene las tablas de los siete modulos. Si la base ya las tiene, usar
-- "supabase db push" para aplicar solo las migraciones pendientes.
--
-- Este script crea: roles internos, esquema private, tablas, vista,
-- funciones RPC, RLS, politicas, disparadores, grants, el disparador de
-- alta de perfiles sobre auth.users y las 26 categorias operativas.
-- No crea usuarios de Auth, contrasenas ni movimientos financieros.

begin;

do $$
begin
  if to_regclass('public.perfiles') is not null then
    raise exception 'La base ya contiene el esquema de siete modulos. Aplica solo las migraciones pendientes con supabase db push.';
  end if;
end $$;

-- 1. Roles internos (mismo contrato que las migraciones)
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'finanzas_rpc') then
    create role finanzas_rpc nologin noinherit nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anf_writer') then
    create role anf_writer nologin noinherit;
  end if;
end $$;

grant finanzas_rpc to postgres;
grant anf_writer to postgres;
create schema if not exists private;
grant usage on schema auth to anf_writer;
grant execute on function auth.uid() to anf_writer;
grant usage on schema public, private to anf_writer;
-- Necesario solo durante la creacion: las RPC pasan a ser propiedad de los roles internos.
grant create on schema public to anf_writer, finanzas_rpc;

-- 2. Esquema, objetos y permisos
--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS private;

ALTER SCHEMA private OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

--
-- Name: actor_actual(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.actor_actual() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select auth.uid()
$$;

ALTER FUNCTION private.actor_actual() OWNER TO postgres;

--
-- Name: anf_actor(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_actor() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select auth.uid()
$$;

ALTER FUNCTION private.anf_actor() OWNER TO postgres;

--
-- Name: anf_alta_perfil(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_alta_perfil() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.perfiles(usuario_id,nombre) values(new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data->>'nombre'),''),'Usuario pendiente'),120));
  return new;
end $$;

ALTER FUNCTION private.anf_alta_perfil() OWNER TO postgres;

--
-- Name: anf_auditar(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_auditar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare n jsonb:=to_jsonb(new); anterior jsonb; a text:=tg_op;
begin
  if n ? 'monto' then n:=jsonb_set(n,'{monto}',to_jsonb(n->>'monto')); end if;
  if tg_op='UPDATE' then
    anterior:=to_jsonb(old);
    if anterior ? 'monto' then anterior:=jsonb_set(anterior,'{monto}',to_jsonb(anterior->>'monto')); end if;
    if n->>'estado'='anulado' then a:='ANULAR'; end if;
  end if;
  insert into public.bitacora(actor_id,accion,entidad,registro_id,motivo,antes,despues)
    values(auth.uid(),a,tg_table_name,coalesce(n->>'id',n->>'usuario_id')::uuid,n->>'motivo_anulacion',anterior,n);
  return new;
end $$;

ALTER FUNCTION private.anf_auditar() OWNER TO postgres;

--
-- Name: anf_bitacora_inmutable(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_bitacora_inmutable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin raise exception 'La bitácora no se modifica ni se elimina' using errcode='42501'; end $$;

ALTER FUNCTION private.anf_bitacora_inmutable() OWNER TO postgres;

--
-- Name: anf_rol(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_rol() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select rol from public.perfiles where usuario_id=(select auth.uid()) and activo
$$;

ALTER FUNCTION private.anf_rol() OWNER TO postgres;

--
-- Name: anf_validar(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.anf_validar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare c public.categorias; r text:=private.anf_rol();
begin
  if tg_table_name in ('ingresos','gastos') then
    if r is null then raise exception 'Cuenta no autorizada' using errcode='42501'; end if;
    if tg_op='UPDATE' then
      if old.estado='anulado' then raise exception 'Registro anulado' using errcode='23514'; end if;
      if old.creado_por<>auth.uid() and r<>'administrador' then raise exception 'No disponible' using errcode='42501'; end if;
      if new.id<>old.id or new.creado_por<>old.creado_por or new.solicitud_id<>old.solicitud_id
        or new.creado_en<>old.creado_en then raise exception 'Origen inmutable' using errcode='23514'; end if;
      new.revision:=old.revision+1;
    else
      if new.creado_por<>auth.uid() or new.estado<>'vigente' then raise exception 'Origen no autorizado' using errcode='42501'; end if;
      new.revision:=1; new.creado_en:=clock_timestamp();
    end if;
    if tg_op='INSERT' or new.categoria_id<>old.categoria_id then
      select * into c from public.categorias where id=new.categoria_id for share;
      if not found or not c.activo or c.tipo<>(case tg_table_name when 'ingresos' then 'ingreso' else 'gasto' end)
        then raise exception 'Categoría incompatible o inactiva' using errcode='23514'; end if;
    end if;
    if new.estado='anulado' then
      new.anulado_por:=auth.uid();new.anulado_en:=clock_timestamp();
    end if;
    new.actualizado_por:=auth.uid();
  elsif tg_table_name='categorias' then
    if r is distinct from 'administrador' then raise exception 'Sin permiso' using errcode='42501'; end if;
    if tg_op='UPDATE' and (new.codigo<>old.codigo or new.tipo<>old.tipo) and
      (exists(select 1 from public.ingresos where categoria_id=old.id) or exists(select 1 from public.gastos where categoria_id=old.id))
      then raise exception 'Categoría utilizada: código y tipo inmutables' using errcode='23514'; end if;
  elsif tg_table_name='perfiles' then
    if new.usuario_id<>old.usuario_id or new.creado_en<>old.creado_en then raise exception 'Identidad inmutable'; end if;
    if r is distinct from 'administrador' and not (auth.uid() is null and session_user in ('postgres','supabase_admin'))
      then raise exception 'Sin permiso' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(742061,1);
    if old.rol='administrador' and old.activo and (new.rol<>'administrador' or not new.activo)
      and not exists(select 1 from public.perfiles where usuario_id<>old.usuario_id and rol='administrador' and activo)
      then raise exception 'Debe permanecer un administrador activo' using errcode='23514'; end if;
  end if;
  new.actualizado_en:=clock_timestamp(); return new;
end $$;

ALTER FUNCTION private.anf_validar() OWNER TO postgres;

--
-- Name: registrar_auditoria(uuid, text, text, uuid, text, text, integer, integer, jsonb); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.registrar_auditoria(p_empresa_id uuid, p_accion text, p_entidad_tipo text, p_entidad_id uuid, p_request_id text, p_motivo text, p_version_anterior integer, p_version_nueva integer, p_cambio_resumido jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'NO_AUTENTICADO';
  end if;

  insert into public.auditoria (
    empresa_id,
    actor_id,
    accion,
    entidad_tipo,
    entidad_id,
    request_id,
    motivo,
    version_anterior,
    version_nueva,
    cambio_resumido
  )
  values (
    p_empresa_id,
    auth.uid(),
    p_accion,
    p_entidad_tipo,
    p_entidad_id,
    coalesce(nullif(btrim(p_request_id), ''), gen_random_uuid()::text),
    p_motivo,
    p_version_anterior,
    p_version_nueva,
    coalesce(p_cambio_resumido, '{}'::jsonb)
  );
end;
$$;

ALTER FUNCTION private.registrar_auditoria(p_empresa_id uuid, p_accion text, p_entidad_tipo text, p_entidad_id uuid, p_request_id text, p_motivo text, p_version_anterior integer, p_version_nueva integer, p_cambio_resumido jsonb) OWNER TO postgres;

--
-- Name: tiene_membresia(uuid); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.tiene_membresia(p_empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.membresias_empresa m
    where m.empresa_id = p_empresa_id
      and m.usuario_id = auth.uid()
      and m.activa
  );
$$;

ALTER FUNCTION private.tiene_membresia(p_empresa_id uuid) OWNER TO postgres;

--
-- Name: tiene_permiso(uuid, text); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE FUNCTION private.tiene_permiso(p_empresa_id uuid, p_permiso text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.membresias_empresa m
    join public.rol_permisos rp on rp.rol_id = m.rol_id
    join public.permisos p on p.id = rp.permiso_id
    where m.empresa_id = p_empresa_id
      and m.usuario_id = auth.uid()
      and m.activa
      and p.codigo = p_permiso
  );
$$;

ALTER FUNCTION private.tiene_permiso(p_empresa_id uuid, p_permiso text) OWNER TO postgres;

--
-- Name: anf_anular_movimiento(text, uuid, integer, text); Type: FUNCTION; Schema: public; Owner: anf_writer
--

CREATE FUNCTION public.anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare t text; rid uuid;
begin
  if private.anf_rol() is null then raise exception 'Sin permiso' using errcode='42501'; end if;
  if p_tipo is null or p_tipo not in ('ingreso','gasto') or length(btrim(coalesce(p_motivo,''))) not between 5 and 500 then
    raise exception 'Motivo o tipo inválido' using errcode='22023'; end if;
  t:=case p_tipo when 'ingreso' then 'ingresos' else 'gastos' end;
  execute format('update public.%I set estado=''anulado'',motivo_anulacion=btrim($1)
    where id=$2 and revision=$3 and estado=''vigente'' returning id',t) into rid using p_motivo,p_id,p_revision;
  if rid is null then raise exception 'Registro no disponible o revisión obsoleta' using errcode='40001'; end if;
  return rid;
end $_$;

ALTER FUNCTION public.anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text) OWNER TO anf_writer;

--
-- Name: anf_guardar_categoria(uuid, timestamp with time zone, text, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: anf_writer
--

CREATE FUNCTION public.anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rid uuid;
begin
  if private.anf_rol() is distinct from 'administrador' then raise exception 'Sin permiso' using errcode='42501'; end if;
  if p_id is null then
    insert into public.categorias(codigo,nombre,tipo,descripcion,activo)
    values(p_codigo,btrim(p_nombre),p_tipo,p_descripcion,p_activo) returning id into rid;
  else
    update public.categorias set codigo=p_codigo,nombre=btrim(p_nombre),tipo=p_tipo,descripcion=p_descripcion,activo=p_activo
    where id=p_id and actualizado_en=p_version returning id into rid;
    if rid is null then raise exception 'Revisión obsoleta' using errcode='40001'; end if;
  end if;
  return rid;
end $$;

ALTER FUNCTION public.anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean) OWNER TO anf_writer;

--
-- Name: anf_guardar_movimiento(text, uuid, integer, uuid, date, text, text, uuid, text); Type: FUNCTION; Schema: public; Owner: anf_writer
--

CREATE FUNCTION public.anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare t text; rid uuid; previo record; actor uuid:=private.anf_actor();
begin
  if private.anf_rol() is null then raise exception 'Sin permiso' using errcode='42501'; end if;
  if p_fecha is null or not isfinite(p_fecha) or p_concepto is null or length(btrim(p_concepto)) not between 2 and 250
    or p_categoria is null or p_solicitud is null or length(coalesce(p_referencia,''))>120
    or p_tipo is null or p_tipo not in ('ingreso','gasto') or p_monto is null
    or p_monto!~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'
    or (p_id is not null and (p_revision is null or p_revision<1)) then
    raise exception 'Entrada inválida' using errcode='22023';
  end if;
  t:=case p_tipo when 'ingreso' then 'ingresos' else 'gastos' end;
  if p_id is null then
    perform pg_advisory_xact_lock(hashtextextended(actor::text||p_solicitud::text,0));
    execute format('select * from public.%I where creado_por=$1 and solicitud_id=$2',t) into previo using actor,p_solicitud;
    if previo.id is not null then
      if previo.fecha<>p_fecha or previo.concepto<>btrim(p_concepto) or previo.monto<>p_monto::numeric
        or previo.categoria_id<>p_categoria or previo.referencia is distinct from nullif(btrim(p_referencia),'') then
        raise exception 'Solicitud reutilizada con otro contenido' using errcode='23505'; end if;
      return previo.id;
    end if;
    execute format('insert into public.%I(fecha,concepto,monto,categoria_id,referencia,solicitud_id)
      values($1,btrim($2),$3::numeric,$4,nullif(btrim($5),''''),$6) returning id',t)
      into rid using p_fecha,p_concepto,p_monto,p_categoria,p_referencia,p_solicitud;
  else
    execute format('update public.%I set fecha=$1,concepto=btrim($2),monto=$3::numeric,categoria_id=$4,referencia=nullif(btrim($5),'''')
      where id=$6 and revision=$7 and estado=''vigente'' returning id',t)
      into rid using p_fecha,p_concepto,p_monto,p_categoria,p_referencia,p_id,p_revision;
    if rid is null then raise exception 'Registro no disponible o revisión obsoleta' using errcode='40001'; end if;
  end if;
  return rid;
end $_$;

ALTER FUNCTION public.anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text) OWNER TO anf_writer;

--
-- Name: anf_guardar_perfil(uuid, timestamp with time zone, text, text, boolean); Type: FUNCTION; Schema: public; Owner: anf_writer
--

CREATE FUNCTION public.anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rid uuid;
begin
  if private.anf_rol() is distinct from 'administrador' then raise exception 'Sin permiso' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(742061,1);
  update public.perfiles set nombre=btrim(p_nombre),rol=p_rol,activo=p_activo
  where usuario_id=p_id and actualizado_en=p_version returning usuario_id into rid;
  if rid is null then raise exception 'Revisión obsoleta' using errcode='40001'; end if;
  return rid;
end $$;

ALTER FUNCTION public.anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean) OWNER TO anf_writer;

--
-- Name: anf_reporte(date, date, uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.anf_reporte(p_desde date, p_hasta date, p_categoria uuid DEFAULT NULL::uuid, p_tipo text DEFAULT NULL::text, p_granularidad text DEFAULT 'mes'::text) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO ''
    AS $$
declare result jsonb; unidad text; paso interval;
begin
  if private.anf_rol() is null then raise exception 'Sin permiso' using errcode='42501'; end if;
  if p_desde is null or p_hasta is null or not isfinite(p_desde) or not isfinite(p_hasta)
    or p_desde>p_hasta or p_hasta-p_desde>3660 or p_granularidad is null or p_granularidad not in ('dia','mes','anio')
    or (p_tipo is not null and p_tipo not in ('ingreso','gasto')) then raise exception 'Filtros inválidos' using errcode='22023'; end if;
  unidad:=case p_granularidad when 'dia' then 'day' when 'mes' then 'month' else 'year' end;
  paso:=case p_granularidad when 'dia' then interval '1 day' when 'mes' then interval '1 month' else interval '1 year' end;
  with filtrados as (
    select * from public.v_movimientos where estado='vigente' and fecha between p_desde and p_hasta
      and (p_categoria is null or categoria_id=p_categoria) and (p_tipo is null or tipo=p_tipo)
  ), totales as (
    select coalesce(sum(monto::numeric) filter(where tipo='ingreso'),0) i,
      coalesce(sum(monto::numeric) filter(where tipo='gasto'),0) g,count(*) n from filtrados
  ), series as (
    select generate_series(date_trunc(unidad,p_desde::timestamp),date_trunc(unidad,p_hasta::timestamp),paso)::date periodo
  ), grupos as (
    select date_trunc(unidad,fecha::timestamp)::date periodo,
      coalesce(sum(monto::numeric) filter(where tipo='ingreso'),0) i,
      coalesce(sum(monto::numeric) filter(where tipo='gasto'),0) g,count(*) n from filtrados group by 1
  ) select jsonb_build_object(
    'resumen',(select jsonb_build_object('ingresos',i::text,'gastos',g::text,'resultado',(i-g)::text,
      'porcentaje_gastos',case when i>0 then round(g/i*100,2)::text else null end,'cantidad',n) from totales),
    'periodos',(select coalesce(jsonb_agg(jsonb_build_object('periodo',s.periodo,'ingresos',coalesce(g.i,0)::text,
      'gastos',coalesce(g.g,0)::text,'resultado',(coalesce(g.i,0)-coalesce(g.g,0))::text,
      'porcentaje_gastos',case when g.i>0 then round(g.g/g.i*100,2)::text else null end,'cantidad',coalesce(g.n,0)) order by s.periodo),'[]'::jsonb)
      from series s left join grupos g using(periodo)),
    'categorias',(select coalesce(jsonb_agg(to_jsonb(d)),'[]'::jsonb) from (
      select categoria,sum(monto::numeric)::text monto from filtrados where tipo='gasto' group by categoria order by categoria) d)
  ) into result;
  return result;
end $$;

ALTER FUNCTION public.anf_reporte(p_desde date, p_hasta date, p_categoria uuid, p_tipo text, p_granularidad text) OWNER TO postgres;

--
-- Name: crear_perfil_nuevo_usuario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.crear_perfil_nuevo_usuario() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.perfiles (id, nombre_visible)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nombre_visible'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

ALTER FUNCTION public.crear_perfil_nuevo_usuario() OWNER TO postgres;

--
-- Name: crear_periodo(uuid, integer, integer, text, text); Type: FUNCTION; Schema: public; Owner: finanzas_rpc
--

CREATE FUNCTION public.crear_periodo(p_empresa_id uuid, p_anio integer, p_mes integer, p_request_id text, p_clave_idempotencia text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_actor uuid := private.actor_actual();
  v_periodo public.periodos%rowtype;
  v_inicio date;
  v_fin date;
  v_clave text := nullif(btrim(p_clave_idempotencia), '');
  v_hash text;
  v_payload jsonb;
  v_resultado jsonb;
  v_idempotente private.operaciones_idempotentes%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'NO_AUTENTICADO',
      'mensaje', 'Tu sesion no es valida. Inicia sesion nuevamente.'
    );
  end if;

  if not private.tiene_permiso(p_empresa_id, 'periodos.gestionar') then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'PERMISO_DENEGADO',
      'mensaje', 'No tenes permiso para gestionar periodos.'
    );
  end if;

  perform 1
  from public.empresas e
  where e.id = p_empresa_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'RECURSO_NO_ENCONTRADO',
      'mensaje', 'La empresa no esta disponible.'
    );
  end if;

  v_payload := jsonb_build_object(
    'empresaId', p_empresa_id,
    'anio', p_anio,
    'mes', p_mes
  );
  v_hash := md5(v_payload::text);

  if v_clave is not null then
    select *
    into v_idempotente
    from private.operaciones_idempotentes oi
    where oi.empresa_id = p_empresa_id
      and oi.operacion = 'crear_periodo'
      and oi.clave = v_clave;

    if found then
      if v_idempotente.hash_payload <> v_hash then
        return jsonb_build_object(
          'ok', false,
          'codigo', 'IDEMPOTENCIA_CONFLICTO',
          'mensaje', 'La clave de reintento ya se uso para otra operacion.'
        );
      end if;

      return v_idempotente.resultado_json;
    end if;
  end if;

  if p_anio is null or p_anio < 2000 or p_anio > 2100 then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'El año debe estar entre 2000 y 2100.'
    );
  end if;

  if p_mes is null or p_mes < 1 or p_mes > 12 then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'El mes debe estar entre 1 y 12.'
    );
  end if;

  v_inicio := make_date(p_anio, p_mes, 1);
  v_fin := (v_inicio + interval '1 month - 1 day')::date;

  insert into public.periodos (
    empresa_id,
    anio,
    mes,
    inicio,
    fin
  )
  values (
    p_empresa_id,
    p_anio,
    p_mes,
    v_inicio,
    v_fin
  )
  returning *
  into v_periodo;

  update public.empresas
  set
    version = version + 1,
    actualizado_en = now()
  where id = p_empresa_id;

  perform private.registrar_auditoria(
    p_empresa_id,
    'periodo.creado',
    'periodo',
    v_periodo.id,
    p_request_id,
    null,
    null,
    1,
    jsonb_build_object('anio', p_anio, 'mes', p_mes)
  );

  v_resultado := jsonb_build_object(
    'ok', true,
    'datos', jsonb_build_object(
      'id', v_periodo.id,
      'version', v_periodo.version
    )
  );

  if v_clave is not null then
    insert into private.operaciones_idempotentes (
      empresa_id,
      operacion,
      clave,
      hash_payload,
      resultado_json,
      creado_por
    )
    values (
      p_empresa_id,
      'crear_periodo',
      v_clave,
      v_hash,
      v_resultado,
      v_actor
    )
    on conflict (empresa_id, operacion, clave) do nothing;
  end if;

  return v_resultado;
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'DUPLICADO',
      'mensaje', 'Ya existe un periodo para ese año y mes.'
    );
end;
$$;

ALTER FUNCTION public.crear_periodo(p_empresa_id uuid, p_anio integer, p_mes integer, p_request_id text, p_clave_idempotencia text) OWNER TO finanzas_rpc;

--
-- Name: guardar_cuenta(uuid, uuid, text, text, uuid, text, text, uuid, boolean, boolean, boolean, date, date, integer, text, text, text); Type: FUNCTION; Schema: public; Owner: finanzas_rpc
--

CREATE FUNCTION public.guardar_cuenta(p_empresa_id uuid, p_cuenta_id uuid, p_codigo text, p_nombre text, p_padre_id uuid, p_clase text, p_naturaleza text, p_rubro_id uuid, p_es_correctora boolean, p_permite_movimiento boolean, p_activa boolean, p_vigencia_desde date, p_vigencia_hasta date, p_version_esperada integer, p_motivo text, p_request_id text, p_clave_idempotencia text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_actor uuid := private.actor_actual();
  v_cuenta public.cuentas%rowtype;
  v_rubro public.rubros_financieros%rowtype;
  v_codigo text := btrim(p_codigo);
  v_nombre text := btrim(p_nombre);
  v_clave text := nullif(btrim(p_clave_idempotencia), '');
  v_hash text;
  v_payload jsonb;
  v_resultado jsonb;
  v_idempotente private.operaciones_idempotentes%rowtype;
  v_version_anterior integer;
  v_version_nueva integer;
  v_revision_catalogo integer;
  v_padre_actual uuid;
  v_paso integer := 0;
begin
  if v_actor is null then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'NO_AUTENTICADO',
      'mensaje', 'Tu sesion no es valida. Inicia sesion nuevamente.'
    );
  end if;

  if not private.tiene_permiso(p_empresa_id, 'catalogo.publicar') then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'PERMISO_DENEGADO',
      'mensaje', 'No tenes permiso para publicar el catalogo.'
    );
  end if;

  perform 1
  from public.empresas e
  where e.id = p_empresa_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'RECURSO_NO_ENCONTRADO',
      'mensaje', 'La empresa no esta disponible.'
    );
  end if;

  v_payload := jsonb_build_object(
    'empresaId', p_empresa_id,
    'cuentaId', p_cuenta_id,
    'codigo', v_codigo,
    'nombre', v_nombre,
    'padreId', p_padre_id,
    'clase', p_clase,
    'naturaleza', p_naturaleza,
    'rubroId', p_rubro_id,
    'esCorrectora', p_es_correctora,
    'permiteMovimiento', p_permite_movimiento,
    'activa', p_activa,
    'vigenciaDesde', p_vigencia_desde,
    'vigenciaHasta', p_vigencia_hasta,
    'versionEsperada', p_version_esperada,
    'motivo', p_motivo
  );
  v_hash := md5(v_payload::text);

  if v_clave is not null then
    select *
    into v_idempotente
    from private.operaciones_idempotentes oi
    where oi.empresa_id = p_empresa_id
      and oi.operacion = 'guardar_cuenta'
      and oi.clave = v_clave;

    if found then
      if v_idempotente.hash_payload <> v_hash then
        return jsonb_build_object(
          'ok', false,
          'codigo', 'IDEMPOTENCIA_CONFLICTO',
          'mensaje', 'La clave de reintento ya se uso para otra operacion.'
        );
      end if;

      return v_idempotente.resultado_json;
    end if;
  end if;

  if v_codigo is null or v_codigo = '' or length(v_codigo) > 40 then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'El codigo es obligatorio y admite hasta 40 caracteres.',
      'campos', jsonb_build_array(
        jsonb_build_object(
          'ruta', 'codigo',
          'codigo', 'REQUERIDO',
          'mensaje', 'Ingresa un codigo de hasta 40 caracteres.'
        )
      )
    );
  end if;

  if v_nombre is null or v_nombre = '' or length(v_nombre) > 160 then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'El nombre es obligatorio y admite hasta 160 caracteres.',
      'campos', jsonb_build_array(
        jsonb_build_object(
          'ruta', 'nombre',
          'codigo', 'REQUERIDO',
          'mensaje', 'Ingresa un nombre de hasta 160 caracteres.'
        )
      )
    );
  end if;

  if p_clase is null or p_clase not in ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto') then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'La clase de cuenta no es valida.'
    );
  end if;

  if p_naturaleza is null or p_naturaleza not in ('deudora', 'acreedora') then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'La naturaleza de cuenta no es valida.'
    );
  end if;

  if p_vigencia_desde is null then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'La vigencia desde es obligatoria.'
    );
  end if;

  if p_vigencia_hasta is not null and p_vigencia_hasta < p_vigencia_desde then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'VALIDACION_ENTRADA',
      'mensaje', 'La vigencia hasta no puede ser anterior a la vigencia desde.'
    );
  end if;

  select *
  into v_rubro
  from public.rubros_financieros r
  where r.id = p_rubro_id
    and r.empresa_id = p_empresa_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'RECURSO_NO_ENCONTRADO',
      'mensaje', 'El rubro no pertenece a la empresa.',
      'campos', jsonb_build_array(
        jsonb_build_object(
          'ruta', 'rubroId',
          'codigo', 'INVALIDO',
          'mensaje', 'Selecciona un rubro de la empresa.'
        )
      )
    );
  end if;

  if p_padre_id is not null then
    if p_cuenta_id is not null and p_padre_id = p_cuenta_id then
      return jsonb_build_object(
        'ok', false,
        'codigo', 'VALIDACION_ENTRADA',
        'mensaje', 'Una cuenta no puede ser su propio padre.'
      );
    end if;

    perform 1
    from public.cuentas c
    where c.id = p_padre_id
      and c.empresa_id = p_empresa_id;

    if not found then
      return jsonb_build_object(
        'ok', false,
        'codigo', 'RECURSO_NO_ENCONTRADO',
        'mensaje', 'La cuenta padre no pertenece a la empresa.'
      );
    end if;
  end if;

  if p_cuenta_id is null then
    insert into public.cuentas (
      empresa_id,
      codigo,
      nombre,
      padre_id,
      clase,
      naturaleza,
      rubro_id,
      es_correctora,
      permite_movimiento,
      activa,
      vigencia_desde,
      vigencia_hasta
    )
    values (
      p_empresa_id,
      v_codigo,
      v_nombre,
      p_padre_id,
      p_clase,
      p_naturaleza,
      p_rubro_id,
      coalesce(p_es_correctora, false),
      coalesce(p_permite_movimiento, true),
      coalesce(p_activa, true),
      p_vigencia_desde,
      p_vigencia_hasta
    )
    returning *
    into v_cuenta;

    v_version_anterior := null;
    v_version_nueva := 1;
  else
    select *
    into v_cuenta
    from public.cuentas c
    where c.id = p_cuenta_id
      and c.empresa_id = p_empresa_id
    for update;

    if not found then
      return jsonb_build_object(
        'ok', false,
        'codigo', 'RECURSO_NO_ENCONTRADO',
        'mensaje', 'La cuenta no esta disponible.'
      );
    end if;

    if p_version_esperada is null or p_version_esperada <> v_cuenta.version then
      return jsonb_build_object(
        'ok', false,
        'codigo', 'VERSION_OBSOLETA',
        'mensaje', 'La cuenta cambio desde que la abriste. Recarga y revisa.'
      );
    end if;

    if v_codigo <> v_cuenta.codigo then
      return jsonb_build_object(
        'ok', false,
        'codigo', 'VALIDACION_ENTRADA',
        'mensaje', 'El codigo de una cuenta existente no se edita; crea una cuenta nueva.',
        'campos', jsonb_build_array(
          jsonb_build_object(
            'ruta', 'codigo',
            'codigo', 'INMUTABLE',
            'mensaje', 'El codigo identifica la cuenta y no cambia.'
          )
        )
      );
    end if;

    v_padre_actual := p_padre_id;

    while v_padre_actual is not null loop
      if v_padre_actual = p_cuenta_id then
        return jsonb_build_object(
          'ok', false,
          'codigo', 'VALIDACION_ENTRADA',
          'mensaje', 'La jerarquia no puede formar un ciclo.'
        );
      end if;

      v_paso := v_paso + 1;

      if v_paso > 64 then
        return jsonb_build_object(
          'ok', false,
          'codigo', 'VALIDACION_ENTRADA',
          'mensaje', 'La jerarquia supera la profundidad permitida.'
        );
      end if;

      select c.padre_id
      into v_padre_actual
      from public.cuentas c
      where c.id = v_padre_actual
        and c.empresa_id = p_empresa_id;
    end loop;

    v_version_anterior := v_cuenta.version;
    v_version_nueva := v_cuenta.version + 1;

    update public.cuentas
    set
      nombre = v_nombre,
      padre_id = p_padre_id,
      clase = p_clase,
      naturaleza = p_naturaleza,
      rubro_id = p_rubro_id,
      es_correctora = coalesce(p_es_correctora, false),
      permite_movimiento = coalesce(p_permite_movimiento, true),
      activa = coalesce(p_activa, true),
      vigencia_desde = p_vigencia_desde,
      vigencia_hasta = p_vigencia_hasta,
      version = v_version_nueva,
      actualizado_en = now()
    where id = p_cuenta_id
    returning *
    into v_cuenta;
  end if;

  update public.empresas
  set
    revision_catalogo = revision_catalogo + 1,
    version = version + 1,
    actualizado_en = now()
  where id = p_empresa_id
  returning revision_catalogo
  into v_revision_catalogo;

  perform private.registrar_auditoria(
    p_empresa_id,
    case
      when p_cuenta_id is null then 'catalogo.cuenta_creada'
      else 'catalogo.cuenta_actualizada'
    end,
    'cuenta',
    v_cuenta.id,
    p_request_id,
    p_motivo,
    v_version_anterior,
    v_version_nueva,
    jsonb_build_object(
      'codigo', v_cuenta.codigo,
      'nombre', v_cuenta.nombre,
      'clase', v_cuenta.clase,
      'naturaleza', v_cuenta.naturaleza
    )
  );

  v_resultado := jsonb_build_object(
    'ok', true,
    'datos', jsonb_build_object(
      'id', v_cuenta.id,
      'version', v_cuenta.version,
      'revisionCatalogo', v_revision_catalogo
    )
  );

  if v_clave is not null then
    insert into private.operaciones_idempotentes (
      empresa_id,
      operacion,
      clave,
      hash_payload,
      resultado_json,
      creado_por
    )
    values (
      p_empresa_id,
      'guardar_cuenta',
      v_clave,
      v_hash,
      v_resultado,
      v_actor
    )
    on conflict (empresa_id, operacion, clave) do nothing;
  end if;

  return v_resultado;
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'codigo', 'DUPLICADO',
      'mensaje', 'Ya existe una cuenta con ese codigo en la empresa.'
    );
end;
$$;

ALTER FUNCTION public.guardar_cuenta(p_empresa_id uuid, p_cuenta_id uuid, p_codigo text, p_nombre text, p_padre_id uuid, p_clase text, p_naturaleza text, p_rubro_id uuid, p_es_correctora boolean, p_permite_movimiento boolean, p_activa boolean, p_vigencia_desde date, p_vigencia_hasta date, p_version_esperada integer, p_motivo text, p_request_id text, p_clave_idempotencia text) OWNER TO finanzas_rpc;

--
-- Name: mis_permisos(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mis_permisos(p_empresa_id uuid) RETURNS TABLE(codigo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select p.codigo
  from public.membresias_empresa m
  join public.rol_permisos rp on rp.rol_id = m.rol_id
  join public.permisos p on p.id = rp.permiso_id
  where m.empresa_id = p_empresa_id
    and m.usuario_id = auth.uid()
    and m.activa
  order by p.codigo;
$$;

ALTER FUNCTION public.mis_permisos(p_empresa_id uuid) OWNER TO postgres;

--
-- Name: reporte_movimientos(date, date, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid DEFAULT NULL::uuid, p_tipo text DEFAULT NULL::text) RETURNS TABLE(id uuid, tipo text, fecha date, concepto text, monto text, categoria_id uuid, codigo_categoria text, categoria text, creado_por uuid)
    LANGUAGE plpgsql STABLE
    SET search_path TO ''
    AS $$
begin
  -- The shared report validates authorization and the full filter range.
  perform public.anf_reporte(p_desde,p_hasta,p_categoria_id,p_tipo);
  return query select m.id,m.tipo,m.fecha,m.concepto,m.monto,m.categoria_id,c.codigo,m.categoria,m.creado_por
    from public.v_movimientos m join public.categorias c on c.id=m.categoria_id
    where m.estado='vigente' and m.fecha between p_desde and p_hasta
      and (p_categoria_id is null or m.categoria_id=p_categoria_id) and (p_tipo is null or m.tipo=p_tipo)
    order by m.fecha,m.id;
end $$;

ALTER FUNCTION public.reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid, p_tipo text) OWNER TO postgres;

--
-- Name: reporte_periodico(date, date, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reporte_periodico(p_desde date, p_hasta date, p_granularidad text DEFAULT 'mes'::text) RETURNS TABLE(periodo date, ingresos text, gastos text, resultado text, porcentaje_gastos text)
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  select r.periodo,r.ingresos,r.gastos,r.resultado,r.porcentaje_gastos
    from jsonb_to_recordset(public.anf_reporte(p_desde,p_hasta,null,null,p_granularidad)->'periodos')
      as r(periodo date,ingresos text,gastos text,resultado text,porcentaje_gastos text)
$$;

ALTER FUNCTION public.reporte_periodico(p_desde date, p_hasta date, p_granularidad text) OWNER TO postgres;

--
-- Name: resumen_financiero(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.resumen_financiero(p_desde date, p_hasta date) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  select (public.anf_reporte(p_desde,p_hasta)->'resumen') || jsonb_build_object(
    'desde',p_desde,'hasta',p_hasta,'moneda','USD',
    'cantidad_ingresos',(select count(*) from public.v_movimientos where tipo='ingreso' and estado='vigente' and fecha between p_desde and p_hasta),
    'cantidad_gastos',(select count(*) from public.v_movimientos where tipo='gasto' and estado='vigente' and fecha between p_desde and p_hasta))
$$;

ALTER FUNCTION public.resumen_financiero(p_desde date, p_hasta date) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: operaciones_idempotentes; Type: TABLE; Schema: private; Owner: postgres
--

CREATE TABLE private.operaciones_idempotentes (
    empresa_id uuid NOT NULL,
    operacion text NOT NULL,
    clave text NOT NULL,
    hash_payload text NOT NULL,
    resultado_json jsonb NOT NULL,
    creado_por uuid,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT operaciones_idempotentes_clave_check CHECK (((length(btrim(clave)) >= 1) AND (length(btrim(clave)) <= 160))),
    CONSTRAINT operaciones_idempotentes_operacion_check CHECK (((length(btrim(operacion)) >= 1) AND (length(btrim(operacion)) <= 80)))
);

ALTER TABLE private.operaciones_idempotentes OWNER TO postgres;

--
-- Name: bitacora; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    fecha_hora timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    accion text NOT NULL,
    entidad text NOT NULL,
    registro_id uuid,
    motivo text,
    antes jsonb,
    despues jsonb,
    CONSTRAINT bitacora_accion_check CHECK ((accion = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'ANULAR'::text, 'MIGRACION'::text])))
);

ALTER TABLE public.bitacora OWNER TO postgres;

--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    descripcion text DEFAULT ''::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT categorias_check CHECK (("left"(codigo, 1) =
CASE tipo
    WHEN 'ingreso'::text THEN 'I'::text
    ELSE 'G'::text
END)),
    CONSTRAINT categorias_codigo_check CHECK ((codigo ~ '^[IG][0-9]{2,4}$'::text)),
    CONSTRAINT categorias_descripcion_check CHECK ((length(descripcion) <= 500)),
    CONSTRAINT categorias_nombre_check CHECK (((length(btrim(nombre)) >= 2) AND (length(btrim(nombre)) <= 100))),
    CONSTRAINT categorias_tipo_check CHECK ((tipo = ANY (ARRAY['ingreso'::text, 'gasto'::text])))
);

ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: gastos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gastos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fecha date NOT NULL,
    concepto text NOT NULL,
    monto numeric NOT NULL,
    categoria_id uuid NOT NULL,
    referencia text,
    estado text DEFAULT 'vigente'::text NOT NULL,
    creado_por uuid DEFAULT auth.uid() NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_por uuid,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    solicitud_id uuid NOT NULL,
    motivo_anulacion text,
    anulado_por uuid,
    anulado_en timestamp with time zone,
    CONSTRAINT ingresos_check CHECK ((((estado = 'vigente'::text) AND (motivo_anulacion IS NULL) AND (anulado_por IS NULL) AND (anulado_en IS NULL)) OR ((estado = 'anulado'::text) AND (motivo_anulacion IS NOT NULL) AND (length(btrim(motivo_anulacion)) >= 5) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT ingresos_concepto_check CHECK (((length(btrim(concepto)) >= 2) AND (length(btrim(concepto)) <= 250))),
    CONSTRAINT ingresos_estado_check CHECK ((estado = ANY (ARRAY['vigente'::text, 'anulado'::text]))),
    CONSTRAINT ingresos_fecha_check CHECK (isfinite(fecha)),
    CONSTRAINT ingresos_monto_check CHECK (((monto > (0)::numeric) AND (monto <= 999999999999.99) AND (scale(monto) <= 2))),
    CONSTRAINT ingresos_motivo_anulacion_check CHECK ((length(motivo_anulacion) <= 500)),
    CONSTRAINT ingresos_referencia_check CHECK ((length(referencia) <= 120)),
    CONSTRAINT ingresos_revision_check CHECK ((revision > 0))
);

ALTER TABLE public.gastos OWNER TO postgres;

--
-- Name: ingresos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingresos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fecha date NOT NULL,
    concepto text NOT NULL,
    monto numeric NOT NULL,
    categoria_id uuid NOT NULL,
    referencia text,
    estado text DEFAULT 'vigente'::text NOT NULL,
    creado_por uuid DEFAULT auth.uid() NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_por uuid,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    solicitud_id uuid NOT NULL,
    motivo_anulacion text,
    anulado_por uuid,
    anulado_en timestamp with time zone,
    CONSTRAINT ingresos_check CHECK ((((estado = 'vigente'::text) AND (motivo_anulacion IS NULL) AND (anulado_por IS NULL) AND (anulado_en IS NULL)) OR ((estado = 'anulado'::text) AND (motivo_anulacion IS NOT NULL) AND (length(btrim(motivo_anulacion)) >= 5) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT ingresos_concepto_check CHECK (((length(btrim(concepto)) >= 2) AND (length(btrim(concepto)) <= 250))),
    CONSTRAINT ingresos_estado_check CHECK ((estado = ANY (ARRAY['vigente'::text, 'anulado'::text]))),
    CONSTRAINT ingresos_fecha_check CHECK (isfinite(fecha)),
    CONSTRAINT ingresos_monto_check CHECK (((monto > (0)::numeric) AND (monto <= 999999999999.99) AND (scale(monto) <= 2))),
    CONSTRAINT ingresos_motivo_anulacion_check CHECK ((length(motivo_anulacion) <= 500)),
    CONSTRAINT ingresos_referencia_check CHECK ((length(referencia) <= 120)),
    CONSTRAINT ingresos_revision_check CHECK ((revision > 0))
);

ALTER TABLE public.ingresos OWNER TO postgres;

--
-- Name: perfiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perfiles (
    usuario_id uuid NOT NULL,
    nombre text NOT NULL,
    rol text DEFAULT 'empleado'::text NOT NULL,
    activo boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT perfiles_nombre_check CHECK (((length(btrim(nombre)) >= 2) AND (length(btrim(nombre)) <= 120))),
    CONSTRAINT perfiles_rol_check CHECK ((rol = ANY (ARRAY['administrador'::text, 'empleado'::text])))
);

ALTER TABLE public.perfiles OWNER TO postgres;

--
-- Name: v_movimientos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_movimientos WITH (security_invoker='true') AS
 SELECT i.id,
    'ingreso'::text AS tipo,
    i.fecha,
    i.concepto,
    (i.monto)::text AS monto,
    i.categoria_id,
    c.nombre AS categoria,
    i.referencia,
    i.estado,
    i.creado_por,
    i.revision,
    i.motivo_anulacion,
    i.anulado_por,
    i.anulado_en,
    p.nombre AS anulador
   FROM ((public.ingresos i
     JOIN public.categorias c ON ((c.id = i.categoria_id)))
     LEFT JOIN public.perfiles p ON ((p.usuario_id = i.anulado_por)))
UNION ALL
 SELECT g.id,
    'gasto'::text AS tipo,
    g.fecha,
    g.concepto,
    (g.monto)::text AS monto,
    g.categoria_id,
    c.nombre AS categoria,
    g.referencia,
    g.estado,
    g.creado_por,
    g.revision,
    g.motivo_anulacion,
    g.anulado_por,
    g.anulado_en,
    p.nombre AS anulador
   FROM ((public.gastos g
     JOIN public.categorias c ON ((c.id = g.categoria_id)))
     LEFT JOIN public.perfiles p ON ((p.usuario_id = g.anulado_por)));

ALTER VIEW public.v_movimientos OWNER TO postgres;

--
-- Name: operaciones_idempotentes operaciones_idempotentes_pkey; Type: CONSTRAINT; Schema: private; Owner: postgres
--

ALTER TABLE ONLY private.operaciones_idempotentes
    ADD CONSTRAINT operaciones_idempotentes_pkey PRIMARY KEY (empresa_id, operacion, clave);

--
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id);

--
-- Name: categorias categorias_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_codigo_key UNIQUE (codigo);

--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);

--
-- Name: gastos gastos_creado_por_solicitud_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_creado_por_solicitud_id_key UNIQUE (creado_por, solicitud_id);

--
-- Name: gastos gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);

--
-- Name: ingresos ingresos_creado_por_solicitud_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_creado_por_solicitud_id_key UNIQUE (creado_por, solicitud_id);

--
-- Name: ingresos ingresos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id);

--
-- Name: perfiles perfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_pkey PRIMARY KEY (usuario_id);

--
-- Name: bitacora_actor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bitacora_actor_id_idx ON public.bitacora USING btree (actor_id);

--
-- Name: bitacora_fecha_hora_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bitacora_fecha_hora_id_idx ON public.bitacora USING btree (fecha_hora DESC, id);

--
-- Name: categorias_nombre_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categorias_nombre_tipo ON public.categorias USING btree (tipo, lower(btrim(nombre)));

--
-- Name: gastos_actualizado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gastos_actualizado_por_idx ON public.gastos USING btree (actualizado_por);

--
-- Name: gastos_anulado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gastos_anulado_por_idx ON public.gastos USING btree (anulado_por);

--
-- Name: gastos_categoria_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gastos_categoria_id_idx ON public.gastos USING btree (categoria_id);

--
-- Name: gastos_creado_por_fecha_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gastos_creado_por_fecha_id_idx ON public.gastos USING btree (creado_por, fecha, id);

--
-- Name: gastos_fecha_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX gastos_fecha_id_idx ON public.gastos USING btree (fecha, id) WHERE (estado = 'vigente'::text);

--
-- Name: ingresos_actualizado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ingresos_actualizado_por_idx ON public.ingresos USING btree (actualizado_por);

--
-- Name: ingresos_anulado_por_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ingresos_anulado_por_idx ON public.ingresos USING btree (anulado_por);

--
-- Name: ingresos_categoria_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ingresos_categoria_id_idx ON public.ingresos USING btree (categoria_id);

--
-- Name: ingresos_creado_por_fecha_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ingresos_creado_por_fecha_id_idx ON public.ingresos USING btree (creado_por, fecha, id);

--
-- Name: ingresos_fecha_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ingresos_fecha_id_idx ON public.ingresos USING btree (fecha, id) WHERE (estado = 'vigente'::text);

--
-- Name: categorias anf_auditar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_auditar AFTER INSERT OR UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION private.anf_auditar();

--
-- Name: gastos anf_auditar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_auditar AFTER INSERT OR UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION private.anf_auditar();

--
-- Name: ingresos anf_auditar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_auditar AFTER INSERT OR UPDATE ON public.ingresos FOR EACH ROW EXECUTE FUNCTION private.anf_auditar();

--
-- Name: perfiles anf_auditar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_auditar AFTER INSERT OR UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION private.anf_auditar();

--
-- Name: bitacora anf_bitacora_inmutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_bitacora_inmutable BEFORE DELETE OR UPDATE ON public.bitacora FOR EACH ROW EXECUTE FUNCTION private.anf_bitacora_inmutable();

--
-- Name: categorias anf_validar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_validar BEFORE INSERT OR UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION private.anf_validar();

--
-- Name: gastos anf_validar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_validar BEFORE INSERT OR UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION private.anf_validar();

--
-- Name: ingresos anf_validar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_validar BEFORE INSERT OR UPDATE ON public.ingresos FOR EACH ROW EXECUTE FUNCTION private.anf_validar();

--
-- Name: perfiles anf_validar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER anf_validar BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION private.anf_validar();

--
-- Name: operaciones_idempotentes operaciones_idempotentes_creado_por_fkey; Type: FK CONSTRAINT; Schema: private; Owner: postgres
--

ALTER TABLE ONLY private.operaciones_idempotentes
    ADD CONSTRAINT operaciones_idempotentes_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: operaciones_idempotentes operaciones_idempotentes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: private; Owner: postgres
--

--
-- Name: bitacora bitacora_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.perfiles(usuario_id);

--
-- Name: gastos gastos_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: gastos gastos_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: gastos gastos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);

--
-- Name: gastos gastos_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: ingresos ingresos_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: ingresos ingresos_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: ingresos ingresos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;

--
-- Name: ingresos ingresos_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.perfiles(usuario_id);

--
-- Name: perfiles perfiles_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

--
-- Name: operaciones_idempotentes; Type: ROW SECURITY; Schema: private; Owner: postgres
--

ALTER TABLE private.operaciones_idempotentes ENABLE ROW LEVEL SECURITY;

--
-- Name: operaciones_idempotentes operaciones_idempotentes_rpc; Type: POLICY; Schema: private; Owner: postgres
--

CREATE POLICY operaciones_idempotentes_rpc ON private.operaciones_idempotentes TO finanzas_rpc USING (true) WITH CHECK (true);

--
-- Name: bitacora; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.bitacora ENABLE ROW LEVEL SECURITY;

--
-- Name: bitacora bitacora_leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY bitacora_leer ON public.bitacora FOR SELECT TO authenticated, anf_writer USING ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text));

--
-- Name: categorias; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias categorias_actualizar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY categorias_actualizar ON public.categorias FOR UPDATE TO anf_writer USING ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text)) WITH CHECK ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text));

--
-- Name: categorias categorias_insertar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY categorias_insertar ON public.categorias FOR INSERT TO anf_writer WITH CHECK ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text));

--
-- Name: categorias categorias_leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY categorias_leer ON public.categorias FOR SELECT TO authenticated, anf_writer USING (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND (activo OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text) OR (EXISTS ( SELECT 1
   FROM public.ingresos
  WHERE ((ingresos.categoria_id = categorias.id) AND (ingresos.creado_por = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.gastos
  WHERE ((gastos.categoria_id = categorias.id) AND (gastos.creado_por = ( SELECT auth.uid() AS uid))))))));

--
-- Name: gastos editar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY editar ON public.gastos FOR UPDATE TO anf_writer USING (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND (estado = 'vigente'::text) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text)))) WITH CHECK (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text))));

--
-- Name: ingresos editar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY editar ON public.ingresos FOR UPDATE TO anf_writer USING (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND (estado = 'vigente'::text) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text)))) WITH CHECK (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text))));

--
-- Name: gastos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

--
-- Name: ingresos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;

--
-- Name: gastos insertar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insertar ON public.gastos FOR INSERT TO anf_writer WITH CHECK (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND (creado_por = ( SELECT auth.uid() AS uid)) AND (estado = 'vigente'::text)));

--
-- Name: ingresos insertar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insertar ON public.ingresos FOR INSERT TO anf_writer WITH CHECK (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND (creado_por = ( SELECT auth.uid() AS uid)) AND (estado = 'vigente'::text)));

--
-- Name: gastos leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY leer ON public.gastos FOR SELECT TO authenticated, anf_writer USING (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text))));

--
-- Name: ingresos leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY leer ON public.ingresos FOR SELECT TO authenticated, anf_writer USING (((( SELECT private.anf_rol() AS anf_rol) IS NOT NULL) AND ((creado_por = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text))));

--
-- Name: perfiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

--
-- Name: perfiles perfiles_editar; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY perfiles_editar ON public.perfiles FOR UPDATE TO anf_writer USING ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text)) WITH CHECK ((( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text));

--
-- Name: perfiles perfiles_leer; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY perfiles_leer ON public.perfiles FOR SELECT TO authenticated, anf_writer USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR (( SELECT private.anf_rol() AS anf_rol) = 'administrador'::text)));

--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO finanzas_rpc;
GRANT USAGE ON SCHEMA private TO anf_writer;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO finanzas_rpc;
GRANT USAGE ON SCHEMA public TO anf_writer;

--
-- Name: FUNCTION actor_actual(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.actor_actual() FROM PUBLIC;
GRANT ALL ON FUNCTION private.actor_actual() TO finanzas_rpc;

--
-- Name: FUNCTION anf_actor(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_actor() FROM PUBLIC;
GRANT ALL ON FUNCTION private.anf_actor() TO anf_writer;
GRANT ALL ON FUNCTION private.anf_actor() TO authenticated;

--
-- Name: FUNCTION anf_alta_perfil(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_alta_perfil() FROM PUBLIC;

--
-- Name: FUNCTION anf_auditar(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_auditar() FROM PUBLIC;

--
-- Name: FUNCTION anf_bitacora_inmutable(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_bitacora_inmutable() FROM PUBLIC;

--
-- Name: FUNCTION anf_rol(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_rol() FROM PUBLIC;
GRANT ALL ON FUNCTION private.anf_rol() TO authenticated;
GRANT ALL ON FUNCTION private.anf_rol() TO anf_writer;

--
-- Name: FUNCTION anf_validar(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.anf_validar() FROM PUBLIC;

--
-- Name: FUNCTION registrar_auditoria(p_empresa_id uuid, p_accion text, p_entidad_tipo text, p_entidad_id uuid, p_request_id text, p_motivo text, p_version_anterior integer, p_version_nueva integer, p_cambio_resumido jsonb); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.registrar_auditoria(p_empresa_id uuid, p_accion text, p_entidad_tipo text, p_entidad_id uuid, p_request_id text, p_motivo text, p_version_anterior integer, p_version_nueva integer, p_cambio_resumido jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION private.registrar_auditoria(p_empresa_id uuid, p_accion text, p_entidad_tipo text, p_entidad_id uuid, p_request_id text, p_motivo text, p_version_anterior integer, p_version_nueva integer, p_cambio_resumido jsonb) TO finanzas_rpc;

--
-- Name: FUNCTION tiene_membresia(p_empresa_id uuid); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.tiene_membresia(p_empresa_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION private.tiene_membresia(p_empresa_id uuid) TO authenticated;
GRANT ALL ON FUNCTION private.tiene_membresia(p_empresa_id uuid) TO finanzas_rpc;

--
-- Name: FUNCTION tiene_permiso(p_empresa_id uuid, p_permiso text); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION private.tiene_permiso(p_empresa_id uuid, p_permiso text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.tiene_permiso(p_empresa_id uuid, p_permiso text) TO authenticated;
GRANT ALL ON FUNCTION private.tiene_permiso(p_empresa_id uuid, p_permiso text) TO finanzas_rpc;

--
-- Name: FUNCTION anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text); Type: ACL; Schema: public; Owner: anf_writer
--

REVOKE ALL ON FUNCTION public.anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text) TO authenticated;
GRANT ALL ON FUNCTION public.anf_anular_movimiento(p_tipo text, p_id uuid, p_revision integer, p_motivo text) TO service_role;

--
-- Name: FUNCTION anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean); Type: ACL; Schema: public; Owner: anf_writer
--

REVOKE ALL ON FUNCTION public.anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean) TO authenticated;
GRANT ALL ON FUNCTION public.anf_guardar_categoria(p_id uuid, p_version timestamp with time zone, p_codigo text, p_nombre text, p_tipo text, p_descripcion text, p_activo boolean) TO service_role;

--
-- Name: FUNCTION anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text); Type: ACL; Schema: public; Owner: anf_writer
--

REVOKE ALL ON FUNCTION public.anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text) TO authenticated;
GRANT ALL ON FUNCTION public.anf_guardar_movimiento(p_tipo text, p_id uuid, p_revision integer, p_solicitud uuid, p_fecha date, p_concepto text, p_monto text, p_categoria uuid, p_referencia text) TO service_role;

--
-- Name: FUNCTION anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean); Type: ACL; Schema: public; Owner: anf_writer
--

REVOKE ALL ON FUNCTION public.anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean) TO authenticated;
GRANT ALL ON FUNCTION public.anf_guardar_perfil(p_id uuid, p_version timestamp with time zone, p_nombre text, p_rol text, p_activo boolean) TO service_role;

--
-- Name: FUNCTION anf_reporte(p_desde date, p_hasta date, p_categoria uuid, p_tipo text, p_granularidad text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.anf_reporte(p_desde date, p_hasta date, p_categoria uuid, p_tipo text, p_granularidad text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.anf_reporte(p_desde date, p_hasta date, p_categoria uuid, p_tipo text, p_granularidad text) TO authenticated;
GRANT ALL ON FUNCTION public.anf_reporte(p_desde date, p_hasta date, p_categoria uuid, p_tipo text, p_granularidad text) TO service_role;

--
-- Name: FUNCTION crear_perfil_nuevo_usuario(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.crear_perfil_nuevo_usuario() FROM PUBLIC;

--
-- Name: FUNCTION crear_periodo(p_empresa_id uuid, p_anio integer, p_mes integer, p_request_id text, p_clave_idempotencia text); Type: ACL; Schema: public; Owner: finanzas_rpc
--

REVOKE ALL ON FUNCTION public.crear_periodo(p_empresa_id uuid, p_anio integer, p_mes integer, p_request_id text, p_clave_idempotencia text) FROM PUBLIC;

--
-- Name: FUNCTION guardar_cuenta(p_empresa_id uuid, p_cuenta_id uuid, p_codigo text, p_nombre text, p_padre_id uuid, p_clase text, p_naturaleza text, p_rubro_id uuid, p_es_correctora boolean, p_permite_movimiento boolean, p_activa boolean, p_vigencia_desde date, p_vigencia_hasta date, p_version_esperada integer, p_motivo text, p_request_id text, p_clave_idempotencia text); Type: ACL; Schema: public; Owner: finanzas_rpc
--

REVOKE ALL ON FUNCTION public.guardar_cuenta(p_empresa_id uuid, p_cuenta_id uuid, p_codigo text, p_nombre text, p_padre_id uuid, p_clase text, p_naturaleza text, p_rubro_id uuid, p_es_correctora boolean, p_permite_movimiento boolean, p_activa boolean, p_vigencia_desde date, p_vigencia_hasta date, p_version_esperada integer, p_motivo text, p_request_id text, p_clave_idempotencia text) FROM PUBLIC;

--
-- Name: FUNCTION mis_permisos(p_empresa_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.mis_permisos(p_empresa_id uuid) FROM PUBLIC;

--
-- Name: FUNCTION reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid, p_tipo text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid, p_tipo text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid, p_tipo text) TO authenticated;
GRANT ALL ON FUNCTION public.reporte_movimientos(p_desde date, p_hasta date, p_categoria_id uuid, p_tipo text) TO service_role;

--
-- Name: FUNCTION reporte_periodico(p_desde date, p_hasta date, p_granularidad text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.reporte_periodico(p_desde date, p_hasta date, p_granularidad text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.reporte_periodico(p_desde date, p_hasta date, p_granularidad text) TO authenticated;
GRANT ALL ON FUNCTION public.reporte_periodico(p_desde date, p_hasta date, p_granularidad text) TO service_role;

--
-- Name: FUNCTION resumen_financiero(p_desde date, p_hasta date); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.resumen_financiero(p_desde date, p_hasta date) FROM PUBLIC;
GRANT ALL ON FUNCTION public.resumen_financiero(p_desde date, p_hasta date) TO authenticated;
GRANT ALL ON FUNCTION public.resumen_financiero(p_desde date, p_hasta date) TO service_role;

--
-- Name: TABLE operaciones_idempotentes; Type: ACL; Schema: private; Owner: postgres
--

GRANT SELECT,INSERT,UPDATE ON TABLE private.operaciones_idempotentes TO finanzas_rpc;

--
-- Name: TABLE bitacora; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bitacora TO service_role;
GRANT SELECT ON TABLE public.bitacora TO authenticated;
GRANT SELECT ON TABLE public.bitacora TO anf_writer;

--
-- Name: TABLE categorias; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categorias TO service_role;
GRANT SELECT ON TABLE public.categorias TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.categorias TO anf_writer;

--
-- Name: TABLE gastos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gastos TO service_role;
GRANT SELECT ON TABLE public.gastos TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.gastos TO anf_writer;

--
-- Name: TABLE ingresos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ingresos TO service_role;
GRANT SELECT ON TABLE public.ingresos TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.ingresos TO anf_writer;

--
-- Name: TABLE perfiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.perfiles TO service_role;
GRANT SELECT ON TABLE public.perfiles TO authenticated;
GRANT SELECT ON TABLE public.perfiles TO anf_writer;

--
-- Name: COLUMN perfiles.nombre; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(nombre) ON TABLE public.perfiles TO anf_writer;

--
-- Name: COLUMN perfiles.rol; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(rol) ON TABLE public.perfiles TO anf_writer;

--
-- Name: COLUMN perfiles.activo; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(activo) ON TABLE public.perfiles TO anf_writer;

--
-- Name: TABLE v_movimientos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_movimientos TO authenticated;
GRANT ALL ON TABLE public.v_movimientos TO service_role;
GRANT SELECT ON TABLE public.v_movimientos TO anf_writer;

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

--
-- PostgreSQL database dump complete
--

revoke create on schema public from anf_writer, finanzas_rpc;

-- 3. Disparador de alta de perfiles sobre auth.users
drop trigger if exists anf_alta_perfil on auth.users;
create trigger anf_alta_perfil
  after insert on auth.users
  for each row execute function private.anf_alta_perfil();

-- 4. Categorias operativas base
-- Las migraciones insertan antes de crear anf_validar; aqui el disparador ya
-- existe, por eso se desactiva solo durante la carga inicial.
alter table public.categorias disable trigger anf_validar;
alter table public.categorias disable trigger anf_auditar;
insert into public.categorias (codigo, nombre, tipo, descripcion, activo) values
  ('G01', 'Ingredientes', 'gasto', 'Harina, levadura, az├║car, manteca y dem├ís ingredientes pagados.', true),
  ('G02', 'Empaques', 'gasto', 'Bolsas, cajas y otros materiales de empaque pagados.', true),
  ('G03', 'Gas de producci├│n', 'gasto', 'Pagos de gas utilizado por los hornos.', true),
  ('G04', 'Energ├¡a el├®ctrica', 'gasto', 'Pagos del suministro de electricidad.', true),
  ('G05', 'Agua', 'gasto', 'Pagos del servicio de agua.', true),
  ('G06', 'Alquiler', 'gasto', 'Pagos por el uso del local.', true),
  ('G07', 'Pagos de personal', 'gasto', 'Pagos operativos al personal; no constituye un m├│dulo de n├│mina.', true),
  ('G08', 'Transporte', 'gasto', 'Pagos de entregas y transporte relacionados con la operaci├│n.', true),
  ('G09', 'Suministros', 'gasto', 'Art├¡culos operativos y de oficina distintos de ingredientes y empaques.', true),
  ('G10', 'Limpieza', 'gasto', 'Productos y servicios de limpieza.', false),
  ('G11', 'Mantenimiento de equipos', 'gasto', 'Reparaci├│n y mantenimiento ordinario de hornos y equipos.', true),
  ('G12', 'Mantenimiento del local', 'gasto', 'Conservaci├│n ordinaria de las instalaciones.', true),
  ('G13', 'Publicidad', 'gasto', 'Pagos de publicidad y promoci├│n.', true),
  ('G14', 'Telefon├¡a e internet', 'gasto', 'Pagos de comunicaciones del negocio.', true),
  ('G15', 'Comisiones de cobro', 'gasto', 'Comisiones pagadas por medios de cobro.', true),
  ('G16', 'Permisos y tasas', 'gasto', 'Pagos operativos identificados por permisos o tasas.', true),
  ('G17', 'Seguros', 'gasto', 'Pagos de seguros relacionados con la operaci├│n.', true),
  ('G18', 'Servicios profesionales', 'gasto', 'Pagos por servicios profesionales recibidos.', true),
  ('G19', 'Uniformes y protecci├│n', 'gasto', 'Pagos por uniformes e implementos de protecci├│n.', true),
  ('G20', 'Otros gastos operativos', 'gasto', 'Pagos no comprendidos en otra categor├¡a; exige un concepto espec├¡fico.', true),
  ('I01', 'Ventas de pan dulce', 'ingreso', 'Cobros por pan dulce vendido.', true),
  ('I02', 'Ventas de pan franc├®s', 'ingreso', 'Cobros por pan franc├®s vendido.', true),
  ('I03', 'Ventas de reposter├¡a', 'ingreso', 'Cobros por pasteles y otros productos de reposter├¡a.', true),
  ('I04', 'Ventas de pan integral', 'ingreso', 'Cobros por productos de panader├¡a integral.', true),
  ('I05', 'Ventas de galletas', 'ingreso', 'Cobros por galletas elaboradas para la venta.', true),
  ('I06', 'Pedidos especiales', 'ingreso', 'Cobros por pedidos identificados como especiales; no duplicar otra venta.', true)
on conflict (codigo) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  actualizado_en = now();
alter table public.categorias enable trigger anf_auditar;
alter table public.categorias enable trigger anf_validar;

commit;
