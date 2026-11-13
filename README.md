# Panadería Carlitos | Finanzas

Control de ingresos y gastos con los **siete módulos de la guía ANF**: usuarios,
ingresos, gastos, categorías, panel financiero, reportes y seguridad/bitácora.
Datos académicos simulados, USD. Se conserva Next.js, no Vite ni PHP/MySQL.

## Iniciar localmente

Requisitos: Node 22, npm y **Docker Desktop abierto, con el motor iniciado**.
La aplicación web y Supabase son procesos distintos: ejecutar `npm run dev`
no inicia la base de datos.

```bash
npm ci
npm run supa:iniciar
```

En la primera instalación, copiar `.env.example` a `.env.local` **sin sobrescribir
una configuración existente**. Consultar las claves del entorno local:

```bash
npx supabase status -o env
```

Completar `.env.local`:

| Variable | Valor local |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` mostrada por el comando anterior |
| `SUPABASE_ADMIN_KEY` | `SECRET_KEY` o `SERVICE_ROLE_KEY` del mismo entorno local; solo servidor |
| `APP_ORIGIN` | `http://localhost:3000` |
| `APP_ENV` | `local` |
| `DEMO_SEED_ENABLED` | `true` para preparar las cuentas de demostración |
| `DEMO_USER_PASSWORD` | Una contraseña local de al menos 8 caracteres |

No pegar estas claves en el README ni compartir la salida completa de `status`.
`.env.local` está excluido de Git. La clave administrativa nunca lleva prefijo
`NEXT_PUBLIC_` ni se coloca en componentes del navegador.

Después de configurar el entorno:

```bash
npm run supa:migrar
npm run preparar:demo
npm run dev
```

Abrir <http://localhost:3000/login>. `preparar:demo` exige
`DEMO_SEED_ENABLED=true`, URL localhost y `DEMO_USER_PASSWORD` de al menos
8 caracteres. Nunca imprime contraseñas ni funciona contra un proyecto remoto.

| Cuenta local | Rol |
| --- | --- |
| `admin@carlitos.local` | Administrador |
| `empleado@carlitos.local` | Empleado |

Ambas usan la contraseña de `DEMO_USER_PASSWORD` en `.env.local`. Los perfiles
anteriores se conservan inactivos; no se promueven roles por inferencia.

**No ejecutar `db reset` para actualizar:** elimina datos locales y cuentas Auth.
La migración conserva el esquema anterior en `archivo_anf_20261025`, sin acceso
API. Antes de migrar una base con datos, generar y verificar un respaldo.

## ¿Qué significa Supabase local?

Los servicios de Supabase se ejecutan en contenedores de Docker **en este equipo**,
no en un proyecto de producción en internet. PostgreSQL almacena los datos;
Auth administra sesiones y contraseñas; la API permite acceder bajo permisos
RLS; Mailpit recibe los correos de prueba sin enviarlos a destinatarios reales.

| Servicio | Dirección | Uso |
| --- | --- | --- |
| Aplicación Next.js | <http://localhost:3000/login> | Pantallas del sistema |
| API y Auth | `http://127.0.0.1:54321` | Conexión configurada en `.env.local` |
| PostgreSQL | `127.0.0.1:54322` | Conexión de herramientas de base de datos |
| Correo local Mailpit | <http://127.0.0.1:54324> | Ver enlaces de recuperación de contraseña |

El arranque mínimo **no inicia Studio**: `http://localhost:54323` no estará
disponible con `supa:iniciar`. Tampoco necesita Storage, Realtime ni Analytics.
Esto reduce el consumo de Docker y no detiene los servicios de otros proyectos.

### Uso diario

Con el entorno ya configurado:

```bash
npm run supa:iniciar
npm run dev
```

Para aplicar cambios de estructura versionados, usar `npm run supa:migrar`.
No hace falta recrear usuarios ni reinstalar dependencias en cada arranque.

Para terminar, detener Next.js con `Ctrl+C` en su terminal y ejecutar:

```bash
npm run supa:detener
```

La parada normal de la CLI conserva el respaldo local para el siguiente arranque.
No equivale a `db reset`; no borrar volúmenes ni usar opciones que omitan el
respaldo si se necesitan conservar los datos. Mantener también copias externas
antes de migraciones importantes: Docker no sustituye una política de respaldo.

### Si la página abre, pero no permite entrar

1. Comprobar que Docker Desktop y `npm run supa:iniciar` terminaron de arrancar.
2. Revisar `npx supabase status`: un puerto abierto no garantiza que Auth responda.
3. Verificar las variables de `.env.local`; si cambiaron, reiniciar Next.js.
4. Para cuentas demo faltantes, ejecutar `npm run preparar:demo`; no usar `db reset`.

Si aparece un conflicto de puertos, identificar el servicio que los ocupa antes
de detenerlo. Si Docker falla al arrancar, revisar espacio libre: sus imágenes
y discos virtuales pueden ocupar bastante en C:, aunque el repositorio esté en E:.

En Windows, Turbopack necesita crear enlaces/junctions para paquetes de servidor.
Usar una unidad NTFS para desarrollo y compilación: exFAT puede devolver
`failed to create junction point`. La validación del 12/11/2026 se realiza en una
copia temporal sobre C: sin cambiar el stack ni mover el repositorio original.

## Uso y alcance

- El administrador gestiona usuarios/categorías y consulta todos los movimientos.
- Usuarios registra cuentas y edita nombre/rol en una pantalla dedicada;
  Seguridad y bitácora consulta identidad/actividad y activa/desactiva el acceso.
- El empleado captura, corrige, anula y consulta exclusivamente los suyos.
- Las anulaciones requieren motivo y son definitivas. No se borran movimientos.
- Panel y reportes excluyen anulados y usan todo el filtro, no solo la página.
- Si no hay ingresos, el porcentaje de gastos es «No aplica».
- Fechas inclusivas, filtros por categoría y reportes diarios/mensuales/anuales.
- El resultado operativo no es automáticamente utilidad contable ni saldo bancario.

El catálogo contable queda como referencia académica. Las rutas anteriores de
diario, estados contables, presupuestos y proyecciones redirigen al panel: no
forman parte de esta entrega. PDF/XLSX es complementario y no está habilitado.

## Verificar

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:api
npm run test:recovery
```

Pruebas SQL (transaccionales; sus datos se revierten):

```bash
docker cp tests/integration/siete-modulos.sql supabase_db_carlitos-finanzas:/tmp/anf-test.sql
docker exec supabase_db_carlitos-finanzas psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/anf-test.sql
```

Pruebas del navegador con la aplicación y Supabase arrancados:

```bash
npx playwright install chromium
npm run test:e2e
```

También se puede usar Chrome instalado mediante `E2E_BROWSER_CHANNEL=chrome`.
`test:api` y `test:e2e` son **solo locales**: crean registros identificados como
`E2E SIMULADO`, los anulan al completar el recorrido y conservan su bitácora.
Las cuentas/categorías creadas por E2E quedan desactivadas, no se borran.

## Estructura y seguridad

Next App Router compone pantallas; Atomic Design presenta DTOs; controladores
autorizan/validan; repositorios leen y ejecutan RPC. La configuración decimal
única usa precisión 40 y HALF_UP. Los importes viajan como texto.

Las escrituras financieras usan RPC con un rol interno limitado y RLS. La clave
administrativa queda en servidor y solo administra identidades Auth. No se usa
el conector remoto: corresponde a otro proyecto y no fue modificado.

- [Decisiones y contrato vigente](docs/implementacion/22_RECONSTRUCCION_SIETE_MODULOS.md)
- [Manual de los siete módulos](docs/validacion_y_entrega/24_MANUAL_SIETE_MODULOS.md)
- [Evidencia real](docs/validacion_y_entrega/20_REGISTRO_DE_VALIDACION_Y_PENDIENTES.md)

El informe académico Word (30–40 páginas), sus referencias y la exposición
grupal de 20 minutos son entregables distintos de las pruebas de software.

La CLI local está fijada en 2.122.0. `supa:iniciar` arranca solo PostgreSQL,
Auth, API/gateway y Mailpit: estos siete módulos no necesitan Storage, Realtime,
Studio ni Analytics. Esto reduce la carga de Docker sin tocar otros proyectos.
La recuperación se consulta en <http://127.0.0.1:54324>; Auth limita el envío de
correos locales a dos por hora. No ejecute repetidamente `test:recovery`.
