# 20. Registro de validación y pendientes

## Mejora posterior: Apache ECharts y guías contextuales

Petición posterior a la publicación `e0bfcb2`: reemplazar el motor de gráficos y
orientar al usuario con pasos. Esta sección conserva la evidencia anterior y
registra por separado la nueva implementación; no cambia fórmulas, RPC ni RLS.

| Evidencia | Ejecución real | Resultado |
| --- | --- | --- |
| EV-GUIA01 | `npm run lint`, `npm run typecheck`, `git diff --check` | Correctos; se mantienen las fronteras de capas y la validación estricta. |
| EV-GUIA02 | `npm run test:unit` | 100 pruebas correctas en 16 archivos: coordenadas acotadas, importes grandes exactos, nulos, pérdidas, opciones ECharts, tablas SSR y ayuda opcional por módulo/rol. |
| EV-GUIA03 | `npm install --save-exact echarts@6.1.0`; revisión del lockfile; `npm audit --json` | Solo se añade ECharts, zrender y sus copias de tslib; sin cambios de versión en paquetes existentes. Diez avisos moderados en las cadenas ya presentes de ExcelJS/ESLint; ninguno en ECharts/zrender. No hay avisos altos/críticos; no se ejecutó `audit fix` ni se cambiaron dependencias ajenas a la petición. |
| EV-GUIA04 | `npm run build`, Next 16.4.2/Turbopack en la copia C: NTFS | Compilación y TypeScript correctos, 49 rutas. ECharts se carga como módulo diferido; las tablas y el estado de carga se renderizan en servidor. No se cambió el bundler ni el stack. |
| EV-GUIA05 | `npm run test:e2e` contra `next start`; recorrido adicional previo en desarrollo | Administrador y empleado: guía con avanzar/retroceder/saltar/cerrar, enlaces que enfocan la captura, foco del primer error, cuatro gráficos listos, líneas/barras, selección con teclado e importe exacto, menú/guía móvil y permisos correctos. Producción sin errores JavaScript ni errores de consola capturados. Se mantienen las verificaciones de captura, anulación y desactivación de sesiones. |
| EV-GUIA06 | Diagnóstico local `validar-echarts-responsive.mjs` contra producción, fixtures identificadas y anuladas al terminar | Gráficos poblados, resultado negativo exacto de `-$160.15`, intervalo de 30 días, movimiento reducido y redimensionado a 375×812, 812×375 y 1440×1000 correctos. Se bloqueó deliberadamente el chunk diferido de ECharts: las tablas conservaron los importes y «Reintentar» recuperó el gráfico al restablecer la carga. |
| EV-GUIA07 | `npm run lint`, `npm run typecheck`, `npm run test:unit` tras separar las vistas consolidadas | Correctos; 103 pruebas en 16 archivos. Nuevas: el empleado recibe exactamente `/ingresos`, `/gastos` y `/categorias`; el administrador conserva los siete; `panel.leer` es exclusivo de los roles de análisis; `rutaInicial` envía al empleado a Ingresos. |
| EV-GUIA08 | `npm run test:e2e` contra `next dev` en la copia NTFS | Administrador y empleado pasan el recorrido completo. El empleado entra directo a Ingresos, ve un menú de tres entradas, y `/dashboard` y `/reportes` le responden `PERMISO_DENEGADO` sin indicadores ni gráficos. El administrador conserva panel, reportes, gráficos y guía. Cero errores de JavaScript o consola. |

La nueva versión queda disponible localmente en `http://localhost:3000/login`,
servida desde la copia NTFS. Las capturas revisadas se conservan en
`test-results/echarts-guias-20261112/` (excluido de Git). No se cargaron cifras de
ejemplo en la interfaz ni se alteraron datos anteriores; las fixtures se
identificaron como simuladas y se anularon mediante RPC autorizadas.

Incidencias corregidas de esta ejecución: ECharts exponía su SVG como una segunda
imagen accesible dentro del contenedor de teclado; el SVG interno ahora está
oculto solo para accesibilidad y el contenedor conserva nombre/foco. Las primeras
capturas de login modificaban el estilo del cursor antes de hidratar; la prueba
ejercita un control de cliente antes de capturar, sin suprimir avisos. El historial
ya superaba 50 ingresos del mismo día: la prueba dejó de suponer que un UUID nuevo
aparece en la primera página y busca las capturas recorriendo la paginación
autorizada, después de comprobar la limpieza del formulario. No se cambió el
orden financiero ni se borraron registros para hacer pasar la prueba.

La evidencia de la sección siguiente corresponde al corte anterior y permanece
como historial. Esta mejora se conserva en cambios locales, sin otra publicación
automática ni modificación de esquema, Auth o permisos.

## Observaciones de `cambios_anf.docx` — 12/11/2026

Se revisaron el texto y las doce imágenes del Word original, sin modificarlo.
SHA-256: `1dadc18e777b322b373dab80cf10efc27f4e7716d894d9bc182f656b1da30008`.
Las diecisiete observaciones y sus decisiones están en
[22](../implementacion/22_RECONSTRUCCION_SIETE_MODULOS.md#observaciones-del-word--12112026).
Base de revisión: `e201529e27c76043cac73a56f55de8c51f334879`, más cambios locales
de esta tarea; no se creó commit ni se publicó una rama.

| Evidencia | Ejecución real | Resultado |
| --- | --- | --- |
| EV-OBS01 | `npm run lint`, `npm run typecheck`, `git diff --check` | Correctos, sin desactivar reglas de capas. |
| EV-OBS02 | `npm run test:unit` | 91 pruebas en 14 archivos. Nuevas regresiones: cuatro series, pérdidas, importes grandes, porcentaje nulo, texto SVG del HTML inicial, contraseñas de ocho caracteres, proxy y separación/autorización de operaciones de usuario. |
| EV-OBS03 | `npm run build` con Next 16.4.2/Turbopack, mismos archivos y dependencias en copia temporal C: NTFS | Compilación y TypeScript correctos, 49 rutas; incluida `/auditoria/usuarios/[id]`. El intento en E: exFAT falla al crear una junction para `jspdf`: limitación del disco, no se cambió el bundler para ocultarla. |
| EV-OBS04 | `tests/integration/siete-modulos.sql`, `ON_ERROR_STOP=1`, Supabase local | 44 comprobaciones correctas y ROLLBACK: RLS, propiedad, idempotencia, revisión, cálculos, último administrador e inmutabilidad de bitácora. |
| EV-OBS05 | `npm run test:api` | Sesiones Auth reales, concurrencia (una actualización confirma y otra devuelve `40001`), importes textuales y aislamiento entre propietarios correctos. Movimientos de prueba anulados. |
| EV-OBS06 | Inspección de Auth local y reinicio exclusivo de Carlitos con `supabase stop`/`start`, preservando respaldo | `GOTRUE_PASSWORD_MIN_LENGTH=8`. No se aplicaron migraciones, no se ejecutó `db reset` y no se detuvieron otros proyectos. |
| EV-OBS07 | `npm run test:e2e`, Chromium contra `next start`; pasada adicional en desarrollo con `E2E_ORIGIN=http://localhost:3001` | Recorrido completo de administrador y empleado correcto, incluidos cuatro gráficos, edición de rol, desactivación de una sesión existente, formularios consecutivos, modales, permisos y vista móvil. Sin errores JavaScript capturados. La ejecución de producción interrumpida por el reinicio se completó después de recuperar el entorno, sin repetir cambios de aplicación. |
| EV-OBS08 | `npm run test:recovery`, Mailpit y Auth locales | Correo real local, restablecimiento con una contraseña de ocho caracteres, login con esa contraseña y rechazo de reutilización del enlace correctos. Se restauró la contraseña demo al terminar. |
| EV-OBS09 | Diagnóstico local `diagnostico-estado-ui.mjs` contra producción | Ocho ciclos correctos de activación/desactivación, cuatro por rol: la UI confirma el estado persistido, la sesión de navegador existente deja de ver indicadores y la misma sesión API recibe `42501` al pedir el reporte. Sin errores JavaScript. Solo se desactivaron las cuentas simuladas exactas del diagnóstico. |

La copia de verificación está en
`%LOCALAPPDATA%/Temp/opencode/anf-validacion-20261112`; no sustituye ni mueve el
repositorio de E:. Para compilar normalmente en Windows se necesita una unidad
que admita los enlaces de Turbopack, como NTFS.

Incidencias conservadas: el primer ensayo SQL suponía 26 categorías activas,
pero `G10` ya estaba inactiva. Se corrigió la prueba para comprobar exactamente
el conjunto activo vigente, sin reactivar datos del usuario. El primer E2E de
esta revisión confirmó alta consecutiva, limpieza, errores y anulación para
ingresos/gastos administrativos, y luego se detuvo por un selector de prueba
ambiguo entre el botón y el título «Registrar usuario». Se hizo explícito el
selector de `summary`.

La revisión visual detectó además que `appearance-none` en la capa utilities
anulaba `base-select` en components. Se corrigió la cascada y la regresión exige
el valor computado del selector, no solo la existencia de estilos del picker.

Las primeras pasadas completas detectaron dos errores React `#418` al recargar
el Panel con datos. El diagnóstico en desarrollo localizó el desajuste en
`<title>` de los SVG: React emitía el título vacío al recibir varios hijos de
texto. Se usa una única cadena interpolada. La regresión SSR falló antes del
cambio y pasó después; la navegación y recarga con gráficos poblados pasan para
ambos roles. No se suprimieron avisos ni se relajó la aserción de errores E2E.
También se corrigieron la redirección heredada que bloqueaba `/usuarios/[id]`
y el reset nativo que desincronizaba los selectores controlados tras guardar.

La espera intermitente de desactivación era una carrera de la prueba: el nombre
no exacto «Activar» también coincidía con «Desactivar». El diagnóstico reprodujo
esa coincidencia antes de pulsar el interruptor. Se exige `exact: true` en los
selectores de estado de usuarios y categorías; no se modificaron ni relajaron
la autorización o las comprobaciones de denegación. La pasada completa final y
los ocho ciclos específicos pasan después del cambio.

Las capturas finales están en `test-results/revision-word-20261112/` (excluido de
Git): login adaptable, Panel vacío/con datos por rol, selector, modal de
categorías, edición/seguridad de usuario, acceso desactivado y bitácora. Se
revisaron visualmente. Los archivos de aplicación, pruebas y configuración de
la copia NTFS se compararon por SHA-256 con E: antes de cerrar la revisión.
No quedaron movimientos simulados vigentes ni cuentas de prueba activas; `G10`
conserva su estado inactivo previo. No se crearon commits, ramas ni publicaciones.

## Corte vigente: reconstrucción de siete módulos — 25/10/2026

La evidencia de esta sección sustituye el estado inicial del 19/10 para la
aplicación actual. Las secciones siguientes se conservan como antecedentes, sin
reescribir sus resultados. Alcance: PDF ANF y los tres contextos nuevos, con
Next.js y **Supabase local** por instrucción del usuario. No se modificó ningún
proyecto remoto ni se ejecutó el SQL histórico del ZIP.

| Evidencia | Ejecución real | Resultado |
| --- | --- | --- |
| EV-SM01 | Respaldo previo `pg_dump -Fc` y restauración completa con `pg_restore --exit-on-error` como `supabase_admin`, en `carlitos_restore_check_20261025` | Restauración correcta: cuatro perfiles, cuatro identidades Auth, 43 cuentas anteriores y 16 políticas anteriores. Base separada del mismo clúster; no equivale a restauración en otro equipo. |
| EV-SM02 | Migraciones locales de siete módulos, incluida `20261026224500_descripciones_catalogo_operativo.sql` | Cinco tablas operativas, 26 categorías con explicación de uso, 12 políticas RLS, vista invoker y contratos de reporte. Tablas anteriores conservadas en `archivo_anf_20261025`, sin acceso API. |
| EV-SM03 | `npm run lint`, `npm run typecheck`, `npm run build` | Correctos. No se introdujeron dependencias de ejecución nuevas ni se actualizaron Next/React. |
| EV-SM04 | `npm run test:unit` | 69 pruebas correctas en 11 archivos; incluye validación de importes/fechas, estado del detalle, zona de fecha sugerida y navegación de siete módulos. Los cálculos reales se comprueban en PostgreSQL, no mediante una fórmula duplicada en React. |
| EV-SM05 | `tests/integration/siete-modulos.sql` con `ON_ERROR_STOP=1` | 44 comprobaciones correctas: RLS, anónimo, propiedad, desactivación, último administrador, invariantes, idempotencia, concurrencia por revisión, filtros, reportes y bitácora inmutable. Todo se revierte con ROLLBACK. |
| EV-SM06 | `npm run test:api` con sesiones Auth reales | Dos actualizaciones simultáneas sobre revisión 1: una confirma y otra devuelve `40001`. Administrador consulta el registro, otro propietario no puede leerlo/anularlo. Importes de API como texto. Datos E2E anulados al finalizar. |
| EV-SM07 | `npm run test:e2e`, Chromium sin interfaz con Playwright | Login de ambos roles; alta y anulación de ingresos/gastos; filtro de movimientos por estado; alta/desactivación de categoría mediante interruptor y filtro administrativo de inactivas; empleado consulta categorías activas filtradas por ingreso/gasto y es rechazado en Usuarios. Menú móvil funciona y no hay desbordamiento a 390 px. Sin errores JavaScript capturados. |
| EV-SM08 | `npm run test:recovery` con Mailpit local | Correo de recuperación real local, verificación de token, contraseña nueva, login con la nueva contraseña y rechazo de reutilización del enlace. La prueba restaura la contraseña demo desde mantenimiento local al finalizar. |
| EV-SM09 | `npm audit` al instalar y `npm audit --omit=dev` | Cero vulnerabilidades reportadas en esa ejecución; no sustituye una revisión periódica. |

Las pruebas E2E están identificadas como `E2E SIMULADO`. Sus movimientos quedan
anulados y sus usuarios/categorías de prueba, inactivos; no se borran para ocultar
el historial. Al cerrar los recorridos verificados no quedaron movimientos
vigentes de prueba. El caso del informe ($12,000 de ingresos, $9,600 de gastos,
$2,400 de resultado y 80 %) se probó transaccionalmente sin cargarlo como dato
operativo de la panadería.

Capturas regenerables, excluidas de Git: `test-results/panel-administrador-desktop.png`
y `test-results/panel-empleado-mobile.png`. Se revisaron ambas visualmente.
Respaldos protegidos fuera del repositorio:
`%LOCALAPPDATA%/Temp/opencode/carlitos-before-seven-modules-20261025.dump` y
`carlitos-seven-modules-20261025.dump` en la misma carpeta.

Incidencias corregidas durante la verificación: sintaxis de una condición CASE
en la migración; pertenencia del rol interno para asignar propietario; permisos
del esquema Auth para ese rol (resueltos con helper privado del actor); manejo
de entradas decimales inválidas antes de construir Decimal; selectores ambiguos
del navegador y aviso de restitución de foco. Las dos primeras migraciones
fallidas se revirtieron transaccionalmente; las correcciones posteriores se
versionaron por separado después de aplicar la migración inicial.

La CLI se fijó en 2.122.0 y el arranque mínimo usa PostgreSQL, Auth, REST/gateway y
Mailpit. Se reinició solo Carlitos para aplicar plantilla de recuperación y
longitud mínima de contraseña. No se reinició Docker ni otros proyectos. El
arranque descargó imágenes nuevas; C: quedó con aproximadamente 2.4 GB libres.
Se requiere administrar ese espacio antes de nuevas descargas importantes.

### Límites y pendientes de entrega

- PDF/XLSX no está habilitado: es complementario, no parte del núcleo obligatorio.
- El Word original todavía menciona Vite y el estado remoto del 21/10. Debe
  actualizarse antes de la entrega; no se sobrescribió el archivo del usuario.
- Revisar extensión/formato APA, fuentes y videoexposición de 20 minutos con
  participación de los tres integrantes. Las pruebas de software no validan
  automáticamente esos entregables académicos.
- La comprobación móvil y de teclado no constituye una auditoría WCAG completa.
  No se ha certificado zoom de 200 %, todos los navegadores ni rendimiento bajo
  carga de producción. No se promete una medición no ejecutada.
- No se desplegó producción ni se configuró el conector remoto. La configuración
  futura de correo y respaldos externos deberá verificarse en su propio entorno.

---

**Proyecto:** Carlitos Finanzas. **Versión documental:** 0.1. **Fecha de corte:** 19 de octubre de 2026.

## 1. Estado real del trabajo

Se revisaron los materiales aportados, se contrastaron cifras del diario mediante aritmética decimal y se elaboró la especificación inicial del sistema. La aplicación Next.js, el esquema Supabase y sus pruebas de software todavía no están implementados en esta entrega. Las PR-01–PR-40 del [plan 18](18_PLAN_DE_PRUEBAS_Y_DATOS_DE_REFERENCIA.md) permanecen pendientes.

Este registro diferencia **evidencia sobre un archivo fuente**, **revisión de documentación** y **prueba de aplicación**. Que un Excel cuadre no demuestra que una importación del sistema cuadre; que una política RLS esté descrita no demuestra que haya sido creada o ensayada.

| Objeto | Estado al corte | Alcance de lo que se puede afirmar |
| --- | --- | --- |
| Materiales proporcionados | Revisados con hallazgos | Inventario, coherencia documental y comprobaciones aritméticas indicadas abajo |
| Documentación en MD | 22 documentos redactados y revisados por coherencia | Diseño y plan concretos; enlaces, identificadores y paquete comprobados |
| Datos corregidos para uso en sistema | Pendientes de publicación | Se conocen correcciones necesarias; no se modificaron los originales |
| Aplicación, migraciones y despliegue | Pendientes | No existe una versión ejecutable entregada en este ZIP |
| Pruebas PR-01–PR-40 | Pendientes | Resultados esperados documentados; ejecución de aplicación aún no realizada |
| Ratificación funcional/contable externa | Pendiente | Las decisiones propuestas no equivalen a aprobación de docente o responsable del negocio |

## 2. Fuentes identificadas

Se recibieron nueve adjuntos correspondientes a siete contenidos únicos. Las copias de Alfa `(2)` y `(3)` coinciden byte a byte; también las del compendio `(1)` y `(2)`. Los hashes SHA-256 siguientes identifican los archivos revisados y permiten distinguir futuras versiones. La comprobación de hashes se realizó al preparar este paquete.

| Fuente | Archivo y, cuando aplica, copia idéntica | SHA-256 |
| --- | --- | --- |
| F1 | `Carlitos_ARQUITECTURA_TECNICA_DETALLADA.docx` | `d97ece78a9e35f01c7f43cc20ff9479bdbe2fd7d15138783b190e9586dd7f04d` |
| F2 | `Carlitos_Reporte_Mejorado.docx` | `ab24d5fdea8b623a35e1ee025dacf3b7cbac7503e095ad58c671c358222e8792` |
| F3 | `Carlitos_BASE_CONTABLE_AMPLIADA.xlsx` | `e38a6763e956d3ed1a30e701640dafd971b16bed5b5a0f82e07c7cd60f70e3cc` |
| F4 | `Caso Analisis Financiero Manufacturas Alfa_2025(2).docx`; copia `(3)` | `fea6dc2962b15b617a4a09da61f0fd28d4ab30c5ea3f3a9f32391cf73d72bc75` |
| F5 | `compendio_razones_financieras_u2(1).pdf`; copia `(2)` | `48338d659a6673b702f1e3cc882febecf54a5a0e05163835d453ee02471bd2b9` |
| F6 | `Branding_Panaderia_Carlitos_COMPLETO.zip` | `fff09bf0acef55a46cd18d65e140e4c1bba9de8dc14cc20eaf14de76c18029dc` |
| F7 | `autoevaluaciones_anf115(1).docx` | `93dc8630fa320b2abc0a8e74f4acb11c2aa35dbb8889a24fd436b73c952e13da` |

Los originales no se incluyen dentro del ZIP de MD. Las referencias por hoja, celda, página y sección permiten contrastar este registro con los adjuntos recibidos. Los resultados de la revisión se transcriben aquí; los scripts y extracciones auxiliares de la sesión no se presentan como código de la aplicación.

## 3. Evidencia de revisión de fuentes

Las evidencias EV-F se obtuvieron durante la revisión previa de los adjuntos del 19 de octubre de 2026 y se consolidan en esta versión documental. El resultado puede ser correcto, contener incidencias o aportar una inferencia. Se conserva esa distinción.

| ID | Método y objeto | Resultado observado | Evidencia localizable |
| --- | --- | --- | --- |
| EV-F01 | Inventario y comparación SHA-256 de los nueve adjuntos | Siete contenidos únicos; dos pares de copias idénticas | Tabla de fuentes de la sección 2 |
| EV-F02 | Inspección de estructura, tipos y literales monetarios de F3 | 12 hojas; 79 cuentas; sin fórmulas Excel, tablas estructuradas, rangos nombrados, gráficos ni validaciones de datos; 3,226 valores H/I sin más de dos decimales efectivos | Hojas del libro; `CATALOGO!A1:I80`, `DIARIO!A1:K1614` y XML de las celdas monetarias |
| EV-F03 | Agrupación del diario por asiento y sumas independientes con Decimal | 477 asientos, 1,613 líneas, 39 cuentas usadas; 0 asientos desbalanceados; debe y haber 2,161,744.81 | `DIARIO!A2:K1614`; totales de auditoría |
| EV-F04 | Cálculo de flujos por ejercicio y saldos por corte desde diario | 34 estados de resultados y 34 balances coinciden con sus hojas; resumen concilia si se interpreta acumulado desde inicio | `ESTADO_RESULTADOS`, `BALANCE_GENERAL`, `RESUMEN_MENSUAL`; valores en documento 18 |
| EV-F05 | Contraste de naturaleza, capital y puente patrimonial | 20 naturalezas de Gastos incoherentes; capital y componentes de patrimonio con diferencias | `CATALOGO!D7`, `D62:D80`; `DIARIO!I15`; `CAMBIOS_PATRIMONIO!C2:G35` |
| EV-F06 | Comparación de cifras de pronóstico con bases históricas | Patrón numérico de acumulado ×1.075 en enero–octubre; repetición de octubre en noviembre/diciembre; falta balance futuro integral | `PRONOSTICO_2027`, `ESCENARIOS`, `PRESUPUESTO_2027`; detalle en sección 4 |
| EV-F07 | Revisión de ejemplos y recálculo de razones | Fixture pequeño concilia; Alfa produce expectativas del documento 18; cobertura del compendio debe ser 1.87, no 1.19 | F2 sección 9; F4 páginas 1–2; F5 página 4 |
| EV-F08 | Reconciliación del alcance entre F1, F2, F6 y F7 | Ocho módulos; conflicto sobre aprobación de presupuesto; marca/demo como referencia; autoevaluaciones sin requerimiento de LMS | F1 roles/plan; F2 alcance/roles; F6 mapa/demo; F7 preguntas y conceptos |

EV-F03 también comprobó ausencia de cuentas inexistentes o agrupadoras usadas como movimiento, líneas con ambos lados positivos, importes negativos y discordancia entre fecha, año y mes. Estos resultados caracterizan el diario aportado; el sistema deberá repetir las validaciones mediante PR-08–PR-14 y rechazar nuevas entradas inválidas.

### 3.1 Cómo se interpretó el diario

Se conservaron los valores de origen y se convirtieron los importes a representación decimal para sumar debe y haber por asiento, cuenta e intervalo. Los flujos de resultados se reiniciaron por ejercicio; los saldos de posición se acumularon hasta cada corte. Para contrastar el resumen se utilizó su base acumulada desde 2024. No se sumaron balances mensuales para formar un balance anual.

El resultado anual se obtuvo por clasificación de las cuentas y movimientos. La naturaleza errónea del campo de Gastos se registró como defecto del catálogo; no se permitió que ese texto invirtiera arbitrariamente el sentido de los gastos al comprobar el diario. El futuro catálogo publicado deberá resolverlo de forma explícita y versionada.

## 4. Hallazgos confirmados y tratamiento

### H-01. Naturaleza de cuentas de gastos

**Observado:** la clase y agrupaciones/cuentas de Gastos figuran como acreedoras en 20 filas: `CATALOGO!D7` y `D62:D80`. Los movimientos ordinarios correspondientes son deudores y las hojas de resultados ya los restan correctamente.

**Impacto:** un importador que aplique literalmente ese campo puede invertir saldos o presentar gastos con signo incorrecto.

**Tratamiento definido:** revisar y publicar una versión del catálogo con clase, naturaleza, rubro y condición de correctora independientes. No aplicar una transformación masiva a todas las cuentas acreedoras. Conservar el original y un registro de mapeo/corrección. **Estado:** corrección especificada, catálogo de aplicación pendiente. Ver RCF-02 y PR-06.

### H-02. Capital y componentes de patrimonio

**Observado:** `CAMBIOS_PATRIMONIO!C2:C35` muestra capital 46,800; el diario de apertura acredita 40,800 en `DIARIO!I15`, sin aportes posteriores que expliquen los 6,000 adicionales. La columna E, rotulada como utilidad acumulada del año, contiene desde 2025 utilidades acumuladas desde el inicio. Los retiros de F reinician por año, mientras el total G incorpora el efecto de retiros anteriores.

La suma de componentes menos el total presentado difiere en **6,000 para cada corte de 2024**, **10,200 en 2025** y **14,400 en 2026**. El total de patrimonio del balance sí concilia con el diario bajo el cálculo revisado.

**Tratamiento definido:** reconstruir el puente por intervalo y saldo inicial, separando aportes, resultados anteriores, resultado del período y retiros. No corregir el balance con una cuenta de ajuste para imitar componentes defectuosos. **Estado:** defecto confirmado, salida corregida del sistema pendiente. Ver RCF-11 y PR-19.

### H-03. Resumen denominado mensual con base acumulada

**Observado:** enero de 2026 muestra ventas 20,441.40 en `ESTADO_RESULTADOS!C26`, mientras `RESUMEN_MENSUAL!D26` contiene 474,901.20, acumulado desde 2024.

**Impacto:** tratar ambos como ventas del mes distorsiona gráficos, comparativos y pronósticos. No es necesario eliminar el acumulado histórico: debe tener su nombre y base correctos.

**Tratamiento definido:** construir series mensuales desde movimientos, declarar mes/acumulado del ejercicio/saldo al corte y advertir comparaciones con duraciones diferentes. **Estado:** semántica corregida en especificación, consultas de aplicación pendientes. Ver RCF-04, RCF-16 y PR-20.

### H-04. Base del pronóstico original

**Observado:** enero de 2027, `PRONOSTICO_2027!D2`, contiene 510,518.79, igual a 474,901.20 ×1.075. El patrón se repite en enero–octubre con la base acumulada correspondiente. Las ventas proyectadas sumadas como meses alcanzan 7,670,417.32. Noviembre y diciembre repiten 734,562.23, el valor de octubre.

**Inferencia:** hay evidencia numérica fuerte de una proyección construida desde acumulados y de repetición de un mes para completar cobertura. Como el libro no contiene fórmulas, no se recuperó ni se verificó el programa que generó esas cifras. Los porcentajes aparentes de costos 48%, gastos 30%, cobros 92%, retiros 35% del resultado y factores de escenario 0.90/1.12 son patrones inferidos, no políticas empresariales confirmadas.

**Tratamiento definido:** regenerar desde una serie mensual validada, guardar método y parámetros, evaluar meses reservados y completar un puente noviembre–diciembre 2026 cuando el horizonte arranque en 2027 desde corte octubre. Las sensibilidades parciales se identifican como tales; un balance futuro exige movimientos de caja, clientes, inventarios, deuda y patrimonio conciliados. **Estado:** pronóstico fuente no apto como expectativa correcta; motor y proyección pendientes. Ver RCF-19, RCF-20 y PR-28–PR-31.

### H-05. Error del compendio

**Observado:** la página 4 muestra una cobertura de pago fijo de 1.19. La expresión impresa `(418000+35000)/(93000+35000+81000/(1-0.29))` equivale aproximadamente a 1.871247, que se presenta como 1.87.

**Tratamiento definido:** usar fórmula y cálculo revisados; conservar el error como caso de regresión. El catálogo de indicadores mostrará insuficiencia de datos si el proyecto no dispone de sus operandos. **Estado:** discrepancia aritmética confirmada y expectativa corregida en FT-03; prueba de servicio pendiente. Ver PR-22.

### H-06. Simulación y alcance de los datos

**Observado:** el libro utiliza cierres mensuales simulados del día 28; octubre de 2026 queda después del 19 de octubre, fecha de esta documentación. Alfa utiliza benchmarks ficticios y una política didáctica; el ejemplo pequeño omite impuestos. Los archivos no aportan unidades/precios, desglose completo fijo-variable, vencimientos de cartera ni toda la información de cobros/pagos futura.

**Tratamiento definido:** origen y cobertura visibles; separar fixtures; denominar el resultado pequeño antes de impuestos; no inferir tasas fiscales aplicables ni inventar antigüedad de cartera, punto de equilibrio o razones de mercado. **Estado:** restricciones incorporadas al alcance, validación de UI pendiente. Ver RCF-01, RCF-17 y PR-07, PR-21–PR-24.

## 5. Registro documental

### EV-D01. Paquete de documentación

- Objeto: 22 MD con índice, negocio, técnica, fases y validación/entrega.
- Comprobaciones realizadas: exactamente 22 nombres previstos, lectura UTF-8, ausencia de archivos extra y marcadores vacíos, 187 enlaces relativos válidos y bloques de código cerrados.
- Catálogos comprobados: 24 RF, ocho RNF, 20 RCF, 23 CU y 40 PR. Todas las PR siguen identificadas como pendientes de aplicación.
- Revisión cruzada: roles, estados, borradores desbalanceados, descarte conservado, idempotencia, bloqueos, versiones de escenario, autoridad de snapshots/reportes y fuentes. Las incoherencias detectadas se corrigieron en los MD correspondientes.
- Comprobación aritmética documental: fixture pequeño de 10 asientos/26 líneas y 52,700.00 por lado, resultado 1,800.00, caja 7,800.00, balance y liquidez; ejemplo de crecimiento 21,974.51 y cobertura fija 1.87.
- Empaquetado: ZIP con 22 entradas Markdown bajo `docs/`; integridad CRC y comparación de los bytes comprimidos/descomprimidos con los MD comprobadas.
- Resultado: **revisión documental satisfactoria**, sin enlaces locales rotos ni documentos previstos ausentes.
- Alcance: integridad y coherencia de la documentación; no ejecuta Next.js, SQL ni pruebas de aplicación.

La comprobación final del ZIP se repite después de incorporar esta entrada de evidencia. Las revisiones técnicas descritas en los MD se basan en los documentos oficiales enlazados en cada área; no acreditan que se hayan instalado las versiones o dependencias.

## 6. Decisiones y pendientes para implementar

| ID | Pendiente | Propuesta de trabajo vigente | Responsable funcional o técnico previsto | Momento necesario |
| --- | --- | --- | --- | --- |
| PD-01 | Publicar catálogo revisado | Corregir naturalezas y mapear rubros con procedencia; mantener correctoras legítimas | B datos y responsable contable/docente | Antes de aprobar la primera importación de referencia |
| PD-02 | Ratificar aprobaciones | Admin aprueba asientos y cierres; gerencia aprueba presupuestos; permisos distintos | Responsable del proyecto/negocio | Antes de aceptar formalmente matriz de roles |
| PD-03 | Fijar políticas financieras aplicables | Usar P-CARLITOS-1 para simulación; documentar costos, clasificación, días, promedios y redondeo | C motor y responsable financiero | Antes de congelar cifras de aceptación |
| PD-04 | Completar entradas de proyección | Calendarios de cobro/pago, inversión, deuda, retiros y puente de meses faltantes | Analista/negocio con C motor | Antes de publicar estados proyectados integrales |
| PD-05 | Confirmar datos y contexto reales si cambia el caso | Mantener prototipo simulado y espacios separados; nueva procedencia si se aportan datos reales | Responsable de los datos | Antes de importar fuentes reales |
| PD-06 | Medir límites y capacidad | Configurar tamaños/filas/expansión y medir FT-01; fijar metas en el equipo de desarrollo | A y B con C calidad | Fase 02 y antes de aceptar RNF-06 |
| PD-07 | Elegir versiones compatibles | Fijar versiones estables al bootstrap, lockfile y runtime; verificar guías oficiales entonces | A y B | Fase 01 |
| PD-08 | Ejecutar prueba de restauración | Probar DB, identidades y archivos con alcance documentado, en instancia separada | B con revisión de C | Antes de afirmar recuperación de la entrega final |
| PD-09 | Confirmar rúbrica, responsables y calendario | Cinco fases con dependencias; tres integrantes como propuesta; cuatro semanas como antecedente | Equipo/docente | Al comprometer fechas y formato académico |
| PD-10 | Incorporar evidencias reales y actualizar manual | Registrar commit, migraciones, fixture, resultado y capturas/archivos solo tras ejecución | Todo el equipo | En cada fase |

Estos pendientes no impiden preparar el entorno ni desarrollar con datos simulados y reglas explícitas. Identifican las condiciones para aceptar datos, políticas o una versión final. No se convierten en solicitudes de aprobación repetidas para tareas de construcción ya autorizadas.

## 7. Cómo registrar pruebas futuras

Al ejecutar una PR se abrirá una evidencia EV-A con ID único. El registro contendrá fecha, versión/commit, esquema/migración, caso PR, fixture/hash, usuario/rol, pasos, esperado, obtenido, resultado y localizador del soporte. Una corrección conserva la ejecución fallida y agrega una ejecución nueva; no reescribe el historial para aparentar que el fallo nunca ocurrió.

Para un defecto se anotará impacto, causa conocida o hipótesis, casos afectados, responsable, estado y criterio de cierre. Si el fallo revela una regla mal especificada, la corrección cambia la regla con justificación y revisa sus expectativas; no altera resultados esperados sin dejar rastro.

**Ejecuciones de aplicación registradas al corte anterior:** ninguna. El número de pruebas aprobadas de la aplicación era cero; describía la etapa de planificación, no un resultado fallido del sistema.

### 7.1 Evidencia de la Fase 01 parcial (19/10/2026)

Se ejecutó el módulo de acceso, catálogo, períodos y auditoría contra Supabase local. Los datos de prueba se eliminaron al terminar; la base quedó con la semilla reproducible.

| ID | Objeto ejecutado | Resultado observado | Estado |
| --- | --- | --- | --- |
| EV-A01 | `npm run verificar:entorno`; `npx supabase start`; cuatro migraciones y `seed.sql`; `db reset --local` posterior; commit `efe9d6e` | Node 22, Docker y Supabase CLI disponibles; migraciones aplicadas desde cero; 2 empresas, 3 roles, 15 permisos, 10 rubros, 42 cuentas de Carlitos y 36 períodos | Aprobada |
| EV-A02 | `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build` | Sin errores; 47 pruebas unitarias en 10 archivos; build de 41 rutas | Aprobada |
| EV-A03 | Login de administrador, analista, gerencia y usuario de la empresa B; usuario autenticado sin membresía | Acceso resuelto por Supabase Auth y membresía; sin membresía se muestra “Acceso pendiente” y no se expone navegación financiera | Aprobada |
| EV-A04 | Catálogo: listar 42 cuentas, crear, editar con motivo, rechazar duplicado y conservar código inmutable | Árbol por jerarquía, naturaleza y rubro; versión incrementada; auditoría registrada; duplicado rechazado | Aprobada |
| EV-A05 | Períodos: listar 36, crear 2027-03, rechazar duplicado y sugerir el año siguiente | Rango mensual correcto, estado abierto, numeración inicial y versión; duplicado rechazado | Aprobada |
| EV-A06 | RPC `guardar_cuenta`, `crear_periodo`, `mis_permisos`; DML directo; aislamiento A/B | Idempotencia y conflicto correctos; versión obsoleta rechazada; DML directo rechazado con `42501`; analista sin `catalogo.publicar`; empresa B no lee ni escribe datos de Carlitos | Aprobada |
| EV-A07 | Recorrido Playwright en build de producción: login, dashboard, catálogo, períodos, alta, auditoría, permisos y aislamiento; prueba de humo posterior al reset | Todos los recorridos esperados; sin `pageerror` ni errores de consola; el reset reconstruyó el esquema y la semilla | Aprobada |
| EV-A08 | Limpieza de cuentas, períodos, auditoría e idempotencia de prueba | La base volvió a 42 cuentas, 36 períodos, auditoría vacía y versión de empresa 1 | Aprobada |

**Cobertura de PR:** PR-01, PR-02, PR-04, PR-06, PR-07 y PR-35 cuentan con evidencia parcial del módulo. PR-03 no se aprueba porque la administración de usuarios sigue sin pantalla. PR-05 no se aprueba porque el diario y sus claves foráneas compuestas pertenecen a la Fase 02. Las demás PR permanecen pendientes.

**Decisión registrada:** las RPC de escritura son propiedad de `finanzas_rpc`; la identidad se obtiene con `private.actor_actual()` porque el rol interno no recibe `USAGE` sobre `auth`. La separación de propietarios y la revocación de DML se conservan. El detalle quedó actualizado en [08](../tecnico/08_AUTENTICACION_PERMISOS_Y_AUDITORIA.md).

**Pendientes inmediatos:** administración de usuarios y membresías (CU-02), cierre y reapertura de períodos (CU-21/22), diario (Fase 02), estados (Fase 03) y pruebas de restauración (PD-08).

## 8. Documentos relacionados

- [Índice del paquete](../00_INDICE_Y_PLAN_DOCUMENTAL.md): estructura, alcance y fuentes.
- [Reglas financieras](../negocio/04_REGLAS_CONTABLES_Y_FINANCIERAS.md): decisiones de dominio que responden a los hallazgos.
- [Motor e importaciones](../tecnico/11_MOTOR_FINANCIERO_E_IMPORTACIONES.md): tratamiento técnico de esas decisiones.
- [Plan de pruebas](18_PLAN_DE_PRUEBAS_Y_DATOS_DE_REFERENCIA.md): datos y expectativas independientes.
- [Trazabilidad](19_TRAZABILIDAD_Y_ENTREGABLES.md): cobertura por requisito y fase.
