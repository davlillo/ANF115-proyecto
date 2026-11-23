-- Verificador de esquema de Carlitos Finanzas (siete modulos).
--
-- Se ejecuta con el rol postgres en el SQL Editor de Supabase y devuelve una
-- sola fila JSON con la huella del esquema. No modifica nada.
--
-- Uso: comparar el resultado de produccion con el de la base local validada.
-- Cualquier diferencia indica que falta aplicar un objeto o que existe un
-- objeto ajeno al alcance.

with objetos as (
  select 'tabla' as tipo, n.nspname || '.' || c.relname as nombre
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private') and c.relkind = 'r'
  union all
  select 'vista', n.nspname || '.' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private') and c.relkind = 'v'
  union all
  select 'funcion', n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
  union all
  select 'columna', n.nspname || '.' || c.relname || '.' || a.attname || ':' || format_type(a.atttypid, a.atttypmod)
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private') and c.relkind = 'r'
    and a.attnum > 0 and not a.attisdropped
  union all
  select 'politica', schemaname || '.' || tablename || '.' || policyname
  from pg_policies where schemaname in ('public', 'private')
  union all
  select 'disparador', c.relname || '.' || t.tgname
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal and n.nspname in ('public', 'private', 'auth')
  union all
  select 'rls', c.relname || '=' || c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  union all
  select 'propietario', n.nspname || '.' || p.proname || ' -> ' || pg_get_userbyid(p.proowner)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
  union all
  select 'permiso', table_schema || '.' || table_name || ' -> ' || grantee || ':' || privilege_type
  from information_schema.role_table_grants
  where table_schema in ('public', 'private')
    and grantee in ('anon', 'authenticated', 'service_role', 'anf_writer', 'finanzas_rpc')
  union all
  select 'rol', rolname || ' login=' || rolcanlogin || ' inherit=' || rolinherit
  from pg_roles where rolname in ('anf_writer', 'finanzas_rpc')
  union all
  select 'migracion', version from supabase_migrations.schema_migrations
)
select jsonb_build_object(
  'huella', (select jsonb_agg(tipo || '|' || nombre order by tipo, nombre) from objetos),
  'resumen', jsonb_build_object(
    'tablas_public', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                      where n.nspname = 'public' and c.relkind = 'r'),
    'tablas_private', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                       where n.nspname = 'private' and c.relkind = 'r'),
    'funciones', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname in ('public', 'private')),
    'politicas', (select count(*) from pg_policies where schemaname in ('public', 'private')),
    'disparadores', (select count(*) from pg_trigger where not tgisinternal),
    'categorias', (select count(*) from public.categorias),
    'categorias_activas', (select count(*) from public.categorias where activo),
    'usuarios_auth', (select count(*) from auth.users),
    'perfiles', (select count(*) from public.perfiles)
  )
) as verificacion;
