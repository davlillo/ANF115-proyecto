# Reconstrucción: siete módulos ANF

Fecha: 25 de octubre de 2026. Decisión solicitada por el usuario.

Este alcance sustituye la planificación contable de cinco fases para la entrega
actual. Se conservan Next.js App Router, React, TypeScript, Tailwind y Supabase
local; las menciones a Vite de los documentos recibidos no cambian el stack.
No se utiliza el conector remoto, que corresponde a otro proyecto.

## Alcance vigente

RF01–RF10 de `../nueva documentacion/01_CONTEXTO_PROYECTO_ANF_CARLITOS (2).md`:
usuarios, ingresos, gastos, categorías, panel financiero, reportes y seguridad/
bitácora. Roles: administrador y empleado. El empleado opera solo sobre sus
movimientos. Los datos de la entrega son simulados, en USD.

La administración del catálogo contable, períodos contables, partida doble,
importaciones, presupuestos y proyecciones no forma parte de esta entrega.
Los archivos anteriores se conservan como antecedentes, no como obligaciones.
Exportar PDF/XLSX es complementario, no criterio del núcleo.

## Contratos y seguridad

- `perfiles`, `categorias`, `ingresos`, `gastos`, `bitacora`: cinco tablas operativas.
- Importes positivos con hasta dos decimales, transporte exclusivamente texto.
- Anulación definitiva con motivo; no hay borrado de movimientos.
- La interfaz no ofrece corrección de movimientos: después del alta solo permite
  anular con motivo. El contrato de actualización se conserva en servidor por
  compatibilidad, pero no se expone como acción de la entrega.
- El detalle admite filtro URL por estado (`vigente` o `anulado`). Este filtro
  afecta únicamente el listado paginado; los indicadores continúan calculándose
  con movimientos vigentes sobre las fechas, categoría y tipo seleccionados.
- Categorías admite filtro URL por tipo (`ingreso` o `gasto`). El empleado
  consulta las categorías activas autorizadas con su descripción de uso;
  no se presentan como cuentas contables. El
  administrador añade filtro de estado (`activa` o `inactiva`) y cambia ese
  estado con el interruptor auditado de cada tarjeta. El alta y la edición usan
  un modal centrado. La edición exige al menos un campo modificado.
- Usuarios presenta filtros URL y un enlace único a `/usuarios/[id]` para editar
  nombre/rol. No carga actividad ni cambia el estado de cuentas existentes.
  Seguridad y bitácora ofrece acceso a `/auditoria/usuarios/[id]` para consultar
  identidad, actividad paginada por actor y activar/desactivar el acceso. No
  existe eliminación: se preservan referencias y bitácora.
- Toda modificación de movimiento incluye revisión esperada; creación incluye
  solicitud UUID estable y comprueba que el contenido del reintento coincida.
- Servidor por solicitud, autorización en controlador y PostgreSQL/RLS.
- RPC estrechas para movimientos. No DML financiero directo del navegador.
- Supabase Auth administra contraseñas; credencial administrativa solo para Auth.
- Ingresos y gastos se agregan sobre todo el filtro, nunca sobre una página.
- Resultado = ingresos − gastos. Porcentaje = gastos / ingresos × 100,
  redondeado HALF_UP; si ingresos = 0, `null` / «No aplica».
- Fechas inclusivas; diferencia máxima de 3660 días; categorías compatibles.

## Observaciones del Word — 12/11/2026

Fuente: `cambios_anf.docx`, texto y doce capturas incrustadas. Esta revisión
reemplaza las decisiones visuales previas indicadas en la tabla; no altera las
fórmulas ni el alcance de autorización de los siete módulos.

| Observación | Decisión implementada | RF |
| --- | --- | --- |
| Encabezados repetidos en cada módulo | Se eliminan título decorativo, subtítulo y eyebrow del contenido. Se conservan navegación, título de documento y `h1` accesible no visual. | RF06, RF08 |
| Etiquetas y avisos sin valor | Se retiran las píldoras repetidas y el aviso contable azul. Una leyenda discreta global identifica datos simulados y USD. Se mantienen estados, errores y confirmaciones necesarias. | RF06, RF10 |
| Gráficos de gastos, ingresos, resultado y porcentaje | Cuatro gráficos temporales, agrupación día/mes/año (día por defecto en Panel), valores exactos desplegables y vacío explícito. El servicio solo escala resultados de `anf_reporte`; no duplica sus fórmulas. | RF07, RF08 |
| Quitar detalle de movimientos | Se retira del Panel; se conserva en Ingresos, Gastos y Reportes para consultar y anular registros. | RF04–RF09 |
| Tarjetas solo en Panel y Reportes | Los indicadores no se muestran en Ingresos/Gastos; se retiran las tarjetas explicativas de Seguridad. | RF07, RF08 |
| Quitar botones Registrar ingreso/gasto | Se quitan los accesos duplicados al formulario ya visible. | RF04, RF05 |
| Limpiar captura automáticamente | Tras éxito se vacían concepto, monto y categoría, se restituye la fecha sugerida y se genera un nuevo UUID. En error se conservan valores y UUID para corregir/reintentar. | RF04, RF05, RF10 |
| Quitar Continuar con otra operación | La siguiente captura queda disponible en el mismo formulario. | RF04, RF05 |
| No desplegar detalle al anular | La confirmación cierra el panel; el motivo se vuelve a abrir solo con Ver detalle. | RF04, RF05 |
| Quitar guía de Categorías | Se retira el banner; se conservan las descripciones de cada categoría. | RF03 |
| Reubicar Nueva categoría | El botón queda en la barra de filtros, fuera del formulario GET. | RF03 |
| Editar categoría en modal central | Modal accesible con cierre, teclado y devolución de foco; sin cambios no habilita Guardar. | RF03 |
| Mejorar desplegables | Selector nativo con picker estilizado mediante `base-select`; mantiene teclado, validación y fallback nativo donde no hay soporte. Sin dependencias nuevas. | RF03–RF06 |
| Un solo botón de acciones de usuario | Gestionar lleva a la pantalla de edición, sin menú flotante de tres acciones. | RF02 |
| Contraseña de ocho caracteres | Mínimo 8 y máximo 128, consistente en alta, recuperación, preparación demo y Auth local; no se truncan contraseñas más largas. | RF01, RF02 |
| Separar Usuarios de Seguridad y bitácora | Alta/edición de información y roles en Usuarios; identidad/actividad/estado en Seguridad. Acciones distintas y autorización también en servidor. | RF02, RF10 |
| Arreglar login | Columnas fluidas en lugar de ancho fijo de 640 px, formulario compacto, errores por campo y correo conservado tras fallo. | RF01 |

Las altas administrativas completadas quedan activas con el rol elegido. El
trigger Auth sigue creando primero un perfil de empleado inactivo: si falla la
asignación posterior, se informa el resultado parcial y se recupera desde
Seguridad, sin repetir el alta. Se mantiene la protección del último administrador.

La compilación y los recorridos se registran en el documento 20. E: es exFAT:
Turbopack no puede crear sus junctions allí. La verificación usa una copia temporal
en C: (NTFS), sin cambiar Next, Turbopack ni el repositorio de trabajo.

## Mejora posterior solicitada: Apache ECharts y uso guiado

La nueva petición del usuario sustituye el trazado SVG manual por **Apache
ECharts 6.1.0**, instalado con versión exacta. Se integra directamente, sin
wrapper React ni CDN, porque no exige una versión de React y permite importar
solo líneas, barras, ejes, tooltip, zoom y accesibilidad. Next 16 y React 19 se
conservan. El motor se carga únicamente en el navegador; cada instancia se
redimensiona con su contenedor y se libera al salir de la pantalla.

La visualización recibe coordenadas acotadas de −100 a 100 calculadas con
Decimal en el servicio de presentación. **No se convierten importes a `number`**:
las etiquetas de ejes, tooltips y tablas conservan los strings originales y los
marcadores exactos del servicio. No se recalculan ingresos, gastos, resultado
ni porcentaje en React. Los nulos siguen siendo «No aplica» y las pérdidas
mantienen su signo. Las tablas se renderizan en servidor aunque el motor falle.

Cada gráfico permite alternar líneas/barras y consultar puntos con puntero,
toque o teclado. El control de intervalo aparece cuando hay más de 14 períodos;
no cambia el filtro ni los totales del servidor. Las animaciones se desactivan.

Los siete módulos incorporan una **Guía paso a paso** opcional, inicialmente
cerrada, con tres pasos, navegación libre y enlaces a acciones reales. No se
reintroducen los encabezados decorativos ni el banner permanente de categorías.
La ayuda de categorías distingue consulta de empleado y administración. El
Panel vacío ofrece un siguiente paso sin cifras ficticias. Los formularios
explican monto/categoría y enfocan el primer error devuelto por el servidor;
la captura rápida sigue en un solo formulario, sin un asistente obligatorio.

RF afectados: RF03–RF10; CU de lectura, captura y administración ya existentes.
No cambia ningún permiso, contrato RPC, fórmula financiera ni esquema SQL.
Las pruebas y límites de esta mejora se registran por separado en el documento
20, sin sustituir la evidencia anterior.

## Alcance por rol: vistas consolidadas

Decisión del 23/11/2026. El empleado opera, no consolida: su menú queda en
**Ingresos, Gastos y Categorías**. El **Panel financiero** y **Reportes** pasan a
depender de un permiso nuevo, `panel.leer`, que solo tienen los roles de análisis
(administrador, analista y gerencia).

La separación es explícita, no un efecto lateral de `finanzas.leer`:

- `finanzas.leer` sigue habilitando la captura y consulta de movimientos.
- `panel.leer` habilita las vistas agregadas y los gráficos consolidados.

Se aplica en tres capas para que ocultar un enlace no sea la única defensa:

1. `PERMISOS_POR_ROL` en `src/config/permisos.ts`.
2. `filtrarNavegacion` en `src/config/navegacion.ts`, que arma el menú.
3. `requerirPerfilOperativo(false, permiso)` en el servidor: `/dashboard` y
   `/reportes` responden `PERMISO_DENEGADO` a un empleado aunque escriba la URL.

El destino tras iniciar sesión lo decide `rutaInicial(permisos)`: el panel para
quien tiene `panel.leer`, Ingresos para el resto. La raíz `/`, el formulario de
acceso, el logo del menú y el enlace del 404 usan ese mismo destino, de modo que
no queda ningún enlace que lleve al empleado a una pantalla sin permiso.

Las guías de tres pasos no cambian: el empleado conserva las de Ingresos, Gastos
y Categorías; las de Panel y Reportes solo las ve quien accede a esas pantallas.

## Migración y reversibilidad

La nueva migración conserva las tablas anteriores en un esquema privado de
archivo, sin acceso API. No elimina usuarios Auth ni movimientos anteriores.
Los perfiles existentes se copian inicialmente como empleados inactivos; no se
convierten roles antiguos ni se concede administración automáticamente.
La preparación demo es exclusivamente local y explícita.

Antes de aplicar: respaldo verificable de la base local. No ejecutar el SQL del
ZIP: corresponde a otro estado inicial. No ejecutar `db reset` para actualizar.
La configuración remota de los adjuntos es evidencia histórica, no una
verificación de la instancia local actual.

## Verificación y límites

La ejecución real de migraciones, RLS por ambos roles, concurrencia, recuperación
de respaldo y recorridos del navegador se documenta en el registro 20. Compilar
no demuestra por sí solo que la integración esté probada. Los contextos MD
recibidos incluyen la decisión de conservar Next.js. El informe Word original
requiere actualización académica de Vite a Next.js y revisión de su evidencia;
no se ha sobrescrito el documento entregado por el usuario.

Se agregó Playwright 1.64.1 como dependencia de desarrollo para reproducir E2E
(requiere Node >=20; compatible con Node 22), y se fijó la CLI Supabase 2.122.0
que ejecutó las migraciones. No se actualizaron Next, React ni las dependencias
de ejecución de la aplicación. Las fórmulas se centralizan en `anf_reporte`;
los servicios TypeScript preparan únicamente proporciones de presentación.
