# 25 — Despliegue en producción

**Proyecto:** Carlitos Finanzas
**Fecha:** 22 de noviembre de 2026

Este documento resume cómo llevar la aplicación a producción: variables de
entorno, esquema de base de datos y verificaciones posteriores. No introduce
cambios de alcance ni de stack.

## 1. Variables de entorno

La validación vive en `src/config/env.server.ts` (Zod) y `src/config/env.public.ts`.
Si falta una obligatoria, el primer acceso a Supabase falla con un mensaje que
nombra la variable.

| Variable | Producción | Se expone al navegador | Obligatoria |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Sí | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del proyecto | Sí | Sí |
| `SUPABASE_ADMIN_KEY` | Secret key del proyecto | **No** | Sí para administrar usuarios |
| `APP_ORIGIN` | `https://<dominio>` | No | Sí |
| `APP_ENV` | `desarrollo` | No | Sí |
| `DEMO_SEED_ENABLED` | `false` | No | No |
| `DEMO_USER_PASSWORD` | No configurar | No | No |

Notas obligatorias:

- **`APP_ENV` no admite `produccion`.** El esquema Zod solo acepta
  `local`, `test` o `desarrollo`. En producción usar `APP_ENV=desarrollo`; con
  `local` o `test` se habilitan rutas y ayudas de desarrollo.
- `NEXT_PUBLIC_*` se incorpora al bundle al compilar: cambiarla exige
  recompilar, no basta reiniciar el proceso.
- `SUPABASE_ADMIN_KEY` nunca lleva prefijo `NEXT_PUBLIC_*`. Se usa solo en
  servidor (`src/supabase/admin.ts`) para listar y crear usuarios de Auth.
- `APP_ORIGIN` debe coincidir con la Site URL y las Redirect URLs de Supabase
  Auth, incluida `https://<dominio>/auth/confirmar`; de lo contrario los
  enlaces de recuperación apuntan a otro host.
- No versionar `.env.local` ni claves reales. `.env.example` documenta los
  nombres y valores esperados sin secretos.

## 2. Base de datos

Las migraciones de `supabase/migrations/` son la fuente autoritativa. Para una
base nueva hay dos caminos equivalentes.

### Estado del proyecto remoto

El proyecto `ANF_PANADERIA_CARLITOS` (`zroatijmzqbdxqirvyvu`, región `us-east-2`)
quedó desplegado el 22/11/2026 con las diez migraciones aplicadas.

Antes de ese despliegue contenía un esquema anterior, distinto del repo
(`private.rol_actual`, `private.validar_movimiento`, disparadores `carlitos_*`),
sin usuarios ni movimientos. Se respaldó el estado previo en
`backups/remoto-20261122/` (esquema y datos, excluido de Git) y se reconstruyó
con `supabase db reset --linked`, que aplica las migraciones del repo.

Verificación posterior:

| Comprobación | Resultado |
| --- | --- |
| `supabase migration list --linked` | 10 migraciones locales y remotas coincidentes |
| Funciones en `public` y `private` | 22 |
| Políticas RLS | 13 |
| Tablas y vista | 6 + `v_movimientos` |
| Disparador `anf_alta_perfil` en `auth.users` | Presente |
| Categorías operativas | 26 (6 ingreso, 20 gasto) |

`supabase/verificar_esquema.sql` reproduce esa comparación: devuelve una huella
JSON de tablas, columnas, funciones, políticas, disparadores, propietarios y
permisos. Se comparó contra la base local validada y no hubo diferencias de
estructura.

### Opción A — migraciones (recomendada)


```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Aplica solo las migraciones pendientes y registra el historial en
`supabase_migrations.schema_migrations`. Si la base ya tiene las tablas de los
siete módulos, este es el único camino válido.

### Opción B — script único

`supabase/esquema_despliegue.sql` contiene el esquema final consolidado: roles
internos, esquema `private`, tablas, vista `v_movimientos`, funciones RPC,
RLS, políticas, disparadores, permisos, el disparador de alta de perfiles sobre
`auth.users` y las 26 categorías operativas.

Ejecutarlo una sola vez como rol `postgres` en el SQL Editor de Supabase. El
script abre una transacción y **aborta con un mensaje explícito si detecta
`public.perfiles`**, para evitar aplicarlo sobre una base ya inicializada.

El script fue verificado sobre una base vacía: instala sin errores y deja RLS,
políticas, permisos y propietarios de funciones idénticos a la base local.
También se comprobó el camino funcional: alta de perfil por disparador, rechazo
de un perfil inactivo, escritura por RPC de un administrador activo, agregación
en `anf_reporte` y registro en `bitacora`.

Las categorías base se insertan con los disparadores de validación suspendidos
de forma temporal, porque en la base nueva todavía no existe un administrador
autenticado. Es la misma condición que resuelven las migraciones al insertar
antes de crear los disparadores.

### Datos que el script no crea

- Usuarios de Auth ni contraseñas. Cada persona se crea desde el módulo
  Usuarios o desde el panel de Supabase.
- Movimientos financieros. Los datos de la entrega son simulados y se cargan
  desde la interfaz.
- Roles de plataforma de Supabase (`anon`, `authenticated`, `service_role`):
  ya existen en el proyecto.

## 3. Primera cuenta administradora

El disparador `anf_alta_perfil` crea todo perfil **inactivo**. Una cuenta recién
registrada no puede operar hasta activarla.

1. Crear la cuenta en Supabase → Authentication → Users (o desde el módulo
   Usuarios con `SUPABASE_ADMIN_KEY` configurada).
2. Ejecutar `supabase/activar_administrador.sql` en el SQL Editor, cambiando el
   correo. Deja el perfil con `rol = 'administrador'` y `activo = true`.
3. Iniciar sesión con esa cuenta.

Las cuentas siguientes se crean y activan desde la propia aplicación.

### Cuentas creadas el 22/11/2026

| Correo | Rol | Nombre |
| --- | --- | --- |
| `admin@carlitos.com` | administrador | Administrador Carlitos |
| `empleado@carlitos.com` | empleado | Empleado Carlitos |

Ambas están confirmadas y activas. Las contraseñas se entregaron por separado y
no se registran en el repositorio: si se pierden, se restablecen desde
Authentication → Users o con el flujo de recuperación de la aplicación.

La activación se aplicó con una migración temporal que suspendió el disparador
`anf_validar` durante la carga, porque el rol de login del CLI no es
`postgres`/`supabase_admin`. Después se retiró del historial con
`supabase migration repair --status reverted`, de modo que local y remoto
conservan las diez migraciones del repositorio.

Verificación realizada contra el proyecto remoto:

| Comprobación | Resultado |
| --- | --- |
| Ingreso con ambas cuentas | Correcto |
| Perfil visible por el administrador | Las dos cuentas, `activo = true` |
| Perfil visible por el empleado | Solo la propia |
| Categorías visibles | 26 en ambos roles |
| `bitacora` consultada por el empleado | 0 filas (RLS) |
| `anf_reporte` como administrador | 200 con importes en texto |

## 4. Verificación posterior

1. `npx supabase migration list` sin diferencias pendientes (si se usó la
   opción A).
2. Confirmar en el SQL Editor:
   - `select count(*) from public.categorias;` → 26
   - `select relname from pg_class where relnamespace = 'public'::regnamespace
     and relkind = 'r' and not relrowsecurity;` → sin filas
   - `select proname, pg_get_userbyid(proowner) from pg_proc where pronamespace
     in ('public'::regnamespace, 'private'::regnamespace);` → las RPC de
     escritura pertenecen a `anf_writer` o `finanzas_rpc`, no a `postgres`.
3. Iniciar sesión con una cuenta administradora y comprobar Panel, Ingresos,
   Gastos, Categorías, Reportes y Seguridad y bitácora.
4. Revisar que un usuario con rol `empleado` solo vea sus propios movimientos.
5. Ejecutar `npm run build` con las variables de producción antes de publicar.

## 5. Riesgos conocidos

- `npm audit` reporta avisos moderados en las cadenas de ExcelJS y ESLint. No
  hay avisos altos ni críticos, y ninguno afecta a ECharts o zrender.
- El rol `postgres` alojado no es superusuario, pero sí tiene `CREATEROLE`.
  Si la plataforma rechaza `CREATE ROLE`, crear `anf_writer` y `finanzas_rpc`
  desde el panel antes de ejecutar el script.
- Ejecutar el script sobre una base con datos existentes está bloqueado por
  diseño; en ese caso usar `supabase db push`.
