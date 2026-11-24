# 09 — Pantallas y Atomic Design

**Proyecto:** Carlitos Finanzas  
**Versión documental:** 0.1 · **Fecha:** 19 de octubre de 2026  
**Estado:** especificación de interfaz y navegación; dashboard, acceso, catálogo, períodos y auditoría implementados en la Fase 01. Las pantallas de diario, estados, presupuestos, escenarios, proyecciones y reportes siguen pendientes.

**Actualización 12/11/2026:** el mapa contable inferior es histórico. En los siete
módulos vigentes se eliminan encabezados decorativos y etiquetas repetidas;
se conserva un `h1` accesible, navegación de ubicación y una leyenda global de
datos simulados/USD. El Panel no contiene detalle de movimientos y muestra
cuatro gráficos temporales; solo Panel y Reportes conservan indicadores.
Categorías abre alta/edición en modal centrado. `/usuarios/[id]` es la pantalla
de edición de información/rol; `/auditoria/usuarios/[id]` contiene identidad,
actividad paginada y estado. `/auditoria?vista=bitacora` muestra el historial
general. Detalle de decisiones y trazabilidad:
[observaciones del Word](../implementacion/22_RECONSTRUCCION_SIETE_MODULOS.md#observaciones-del-word--12112026).

**Mejora posterior solicitada:** los cuatro gráficos se renderizan con Apache
ECharts, con cambio líneas/barras y tablas exactas renderizadas en servidor.
Los módulos incluyen ayuda opcional de tres pasos, sin tutoriales bloqueantes.
Las decisiones de carga, precisión y accesibilidad están en el documento 22.

**Alcance por rol (23/11/2026):** el empleado ve solo Ingresos, Gastos y
Categorías. Panel financiero y Reportes dependen de `panel.leer` y se reservan a
los roles de análisis. La restricción se aplica en la navegación y en el
servidor; el destino tras el acceso lo resuelve `rutaInicial(permisos)`. Detalle
en el documento 22.

## 1. Criterio de diseño

Cada pantalla tiene un propósito visible, un contexto financiero y una operación principal. La navegación respeta la estructura de `src/app` del [documento 06](06_DIRECTORIOS_Y_CONVENCIONES.md). Las pantallas comparten componentes mediante Atomic Design; las fórmulas y permisos efectivos se resuelven en el servidor.

El material de branding aporta una referencia visual académica y una demo con datos ficticios. Se toman como orientación café `#321B13`, terracota `#A84D2B` y crema `#FFFDF9`, sujetos a comprobar contraste al implementarlos. La demo no acredita módulos funcionales existentes. [F6]

## 2. Estructura visual común

`AppShell` distribuye navegación lateral, encabezado, área de contenido y mensajes. En pantallas pequeñas, el menú pasa a una navegación desplegable manteniendo los mismos destinos. El encabezado financiero muestra empresa, origen simulado/real, moneda y período o corte.

Los filtros que cambian un resultado se conservan en la URL. Una recarga o enlace compartido entre usuarios autorizados debe reconstruir la misma selección; no garantiza conservar la misma revisión si los datos cambiaron, por lo que también se muestra la revisión consultada.

Una pantalla que presenta importes incluye una leyenda clara de la base temporal: movimiento del período, acumulado del ejercicio o saldo al corte. Los saldos de distintos meses no se suman en una tarjeta anual. Las fechas de octubre de 2026 del conjunto Carlitos se identifican como simulación de cierre, conforme al origen auditado. [F3]

## 3. Mapa completo de rutas

En esta tabla, “lectura” requiere membresía activa y `finanzas.leer`. Los permisos de botones adicionales se evalúan por separado.

| URL | Propósito y contenido principal | Permiso principal | Fase |
| --- | --- | --- | --- |
| `/` | Resolver sesión y destino inicial | Acceso | 01 |
| `/login` | Correo y contraseña, errores de acceso | Público | 01 |
| `/dashboard` | Resumen, corte, origen, calidad y accesos a detalle | Lectura | Base 01; datos 03 |
| `/usuarios` | Usuarios, membresías y estado | `usuarios.gestionar` | 01 |
| `/usuarios/nuevo` | Alta de usuario y membresía | `usuarios.gestionar` | 01 |
| `/usuarios/[id]` | Edición de membresía y rol autorizado | `usuarios.gestionar` | 01 |
| `/usuarios/permisos` | Matriz de roles y permisos efectivos | `usuarios.gestionar` | 01 |
| `/catalogo` | Árbol de cuentas, búsqueda y vigencia | Lectura | 01 |
| `/catalogo/nueva` | Alta de cuenta y clasificación | `catalogo.publicar` | 01 |
| `/catalogo/[id]` | Cuenta, rubro, naturaleza y referencias | Lectura; edición con publicación | 01 |
| `/periodos` | Calendario, disponibilidad, abierto/cerrado | Lectura | 01 |
| `/periodos/[id]/cierre` | Revisión previa, cierre y reapertura | `periodos.cerrar` o `periodos.reabrir` | 05 |
| `/importaciones` | Carga e historial de lotes | Lectura; carga con preparación | 02 |
| `/importaciones/[id]` | Filas, errores, totales y confirmación | Lectura; acciones con preparación | 02 |
| `/diario` | Lista de asientos por fecha, cuenta y estado | Lectura | 02 |
| `/diario/nuevo` | Borrador manual | `asientos.preparar` | 02 |
| `/diario/[id]` | Líneas, validación, aprobación y reversión | Lectura; acciones según permiso | 02 |
| `/estados` | Elegir informe y base temporal | Lectura | 03 |
| `/estados/comprobacion` | Débitos, créditos y saldos por cuenta | Lectura | 03 |
| `/estados/resultados` | Ingresos, costos, gastos y resultado | Lectura | 03 |
| `/estados/balance` | Activos, pasivos, patrimonio y cuadre | Lectura | 03 |
| `/estados/patrimonio` | Saldo inicial, movimientos y saldo final | Lectura | 03 |
| `/presupuestos` | Versiones por ejercicio y creación | Lectura; crear con preparación | 04 |
| `/presupuestos/[id]` | Líneas mensuales, efectivo y revisión | Lectura; edición o aprobación según permiso | 04 |
| `/presupuestos/[id]/comparativo` | Real, presupuesto y desviaciones | Lectura | 04 |
| `/escenarios` | Escenarios y sus versiones | Lectura; crear con ejecución | 04 |
| `/escenarios/[id]` | Método, supuestos, cobertura y pronóstico | Lectura; cambios con ejecución | 04 |
| `/escenarios/comparar` | Comparación de versiones seleccionadas | Lectura | 04 |
| `/proyecciones` | Historial de ejecuciones integradas | Lectura | 05 |
| `/proyecciones/[id]/resultados` | Resultado futuro por mes | Lectura | 05 |
| `/proyecciones/[id]/balance` | Balance futuro y conciliaciones | Lectura | 05 |
| `/proyecciones/[id]/patrimonio` | Evolución futura del patrimonio | Lectura | 05 |
| `/analisis/indicadores` | Ratios, operandos, fórmulas y calidad | Lectura | 03 |
| `/analisis/comparativo` | Análisis horizontal y vertical | Lectura | 03 |
| `/reportes` | Generar e inspeccionar historial de archivos | Lectura; generar con exportación | 05 |
| `/reportes/[id]` | Fuente, versión, estado y descarga | Lectura; descargar con exportación | 05 |
| `/auditoria` | Eventos filtrados, actores y motivos | `auditoria.leer` | Desde 01 |
| `/configuracion` | Datos de empresa y políticas iniciales | Administración autorizada | 01; ampliación posterior |

Alta de presupuesto o escenario puede empezar con un diálogo en su listado y continuar en la página de detalle recién creada. No requiere una ruta `nuevo` adicional en esta versión. La configuración inicial de moneda, origen y política se carga de forma controlada; no se habilitan cambios capaces de reinterpretar históricos mediante un formulario genérico.

## 4. Especificación de pantallas críticas

### 4.1 Acceso y usuarios

Login muestra campos etiquetados, opción de visualizar contraseña, progreso y mensaje de error que no expone detalles internos. Tras autenticarse se resuelve la membresía; un usuario sin empresa activa recibe una explicación de acceso pendiente, sin un dashboard vacío que aparente autorización.

Usuarios presenta nombre, correo de gestión cuando corresponda, rol, estado y última modificación administrativa disponible. Cambiar rol o desactivar membresía exige confirmación de la acción concreta y se refleja en auditoría. El formulario no permite introducir libremente un código de permiso desconocido.

### 4.2 Catálogo y períodos

El catálogo muestra código como texto, nombre, clase, naturaleza, rubro, cuenta padre, movimiento permitido y vigencia. La ficha advierte cuándo una cuenta tiene movimientos y qué cambios de clasificación afectarán nuevos análisis. Los errores detectados en el Excel —incluida la naturaleza de gastos— se resuelven en la revisión del catálogo; no se ocultan mediante un color. [F3]

La lista de períodos distingue “sin datos”, “con borradores”, “con movimientos contabilizados” y “cerrado”, sin convertir esas etiquetas de calidad en estados nuevos del período. Cierre muestra conciliaciones, pendientes, corte, revisión y motivo. Reabrir conserva visible el cierre anterior.

### 4.3 Importación

El flujo tiene cuatro partes: archivo y origen; validación; vista previa; confirmación a borradores. Cada parte muestra su resultado persistido.

La vista previa contiene hoja/fila, identificador de asiento, cuenta, fecha, debe, haber, error de campo y resumen por asiento. Debe permitir filtrar errores sin perder el total original de filas. Un mensaje señala cuántos asientos entrarán y que necesitarán aprobación para afectar estados.

Un lote `con_errores` no ofrece confirmación. El usuario puede revalidar datos normalizados permitidos conservando la procedencia, o cargar una versión de archivo nueva vinculada. Un lote confirmado conserva su detalle y enlaces a los asientos generados. No se muestra un botón que vuelva a confirmar como si fuera una carga nueva.

### 4.4 Diario

El formulario permite agregar líneas, elegir cuentas de movimiento, introducir importes y ver debe, haber y diferencia. Un borrador desbalanceado se puede guardar si cumple las restricciones básicas; la diferencia permanece visible. “Validar” exige cuadre. Editar un validado lo devuelve a borrador.

Un no contabilizado que se abandone puede descartarse con motivo. La interfaz conserva su detalle y origen, lo identifica mediante una marca administrativa y ofrece el filtro “Incluir descartados”; no permite volver a editarlo o aprobarlo. Los descartados no bloquean el cierre.

En detalle, “Aprobar” exige `asientos.aprobar` y revalida en servidor. Un asiento contabilizado muestra su origen y aprobación y deja de ofrecer edición de líneas. “Revertir” solicita fecha, período permitido y motivo; después muestra enlaces entre original y contrapartida. La interfaz no elimina el original de la consulta contable.

### 4.5 Estados e indicadores

Los tres estados utilizan el mismo encabezado y formato monetario. Un rubro permite abrir las cuentas que lo integran y, para Carlitos, los movimientos relacionados. Patrimonio muestra explícitamente la ecuación de conciliación y la diferencia, si existe.

La ficha de indicador presenta nombre, valor/unidad, estado de cálculo, fórmula, operandos, procedencia y política. Un dato ausente muestra su causa. Una aproximación calculable puede mostrar valor y advertencia simultáneamente; no se sustituye por una cifra cero.

El comparativo obliga a elegir bases comparables. Enero–octubre frente a año completo muestra advertencia y no se etiqueta como variación interanual equivalente. Los porcentajes de análisis vertical identifican el total que actúa como base.

### 4.6 Presupuestos, escenarios y proyecciones

La cuadrícula presupuestaria separa líneas económicas de cobros y pagos. Cada edición identifica versión, mes y rubro. En revisión se muestra la decisión pendiente; una versión aprobada presenta lectura y opción de crear otra versión, sin sobrescribirla.

Un escenario contiene método, serie base, parámetros, cobertura y meses reservados para evaluación. El botón de pronóstico preliminar no promete un balance integrado. La fase 05 requiere saldo inicial, calendarios y puente de meses faltantes.

Las proyecciones muestran tres estados de la misma ejecución y conciliación mensual. Si falta noviembre–diciembre de 2026 antes de proyectar 2027, se solicita o identifica la estimación del puente. Los supuestos visibles y la etiqueta de estimación viajan al reporte.

### 4.7 Reportes y auditoría

Reportes muestra tipo, formato, fuente, revisión, creador, fecha y estado. Solo `listo` permite descargar. Un archivo fallido ofrece causa tratable y reintento controlado, manteniendo la fuente elegida. La exportación completa se recompone desde la captura y las versiones del motor y plantilla; no se limita a la página visible de una tabla ni toma totales enviados por navegador.

Auditoría filtra por intervalo, actor, entidad y acción. Cada evento indica motivo y versiones cuando apliquen. La pantalla es de consulta: no presenta controles para editar o borrar la historia.

## 5. Catálogo Atomic Design

| Nivel | Componente | Contrato esperado |
| --- | --- | --- |
| Átomo | `MoneyText` | Importe string, moneda y formato; nunca suma importes |
| Átomo | `Button` | Estado ocupado, etiqueta y acción |
| Átomo | `Badge` | Etiqueta y variante semántica |
| Molécula | `PeriodSelector` | Intervalo/corte válidos, base temporal y callback |
| Molécula | `MetricCard` | Valor/unidad, estado, comparación y enlace |
| Molécula | `SourceBadge` | Origen y condición estimada |
| Molécula | `ValidationSummary` | Totales de errores y navegación a campos |
| Organismo | `JournalForm` | Borrador DTO, catálogos autorizados y acciones |
| Organismo | `ImportPreview` | Lote, filas paginadas, totales y capacidades |
| Organismo | `FinancialStatement` | Rubros, importes y contexto de una ejecución |
| Organismo | `BudgetGrid` | Versión, líneas y permisos de edición |
| Organismo | `RatioDetail` | Fórmula, operandos y explicación |
| Plantilla | `AppShell` | Navegación, encabezado y contenido |
| Plantilla | `ReportTemplate` | Metadatos de ejecución y secciones de informe |

Los componentes de cliente reciben capacidades para presentar acciones, pero el servidor vuelve a comprobarlas. Los organismos no llaman directamente a tablas de Supabase ni ejecutan consultas SQL.

## 6. Estados de experiencia y accesibilidad

| Estado | Presentación y siguiente paso |
| --- | --- |
| Cargando | Estructura de carga estable y etiqueta de progreso |
| Sin registros | Explicación del período y acción autorizada para comenzar |
| Error de campo | Mensaje junto al campo y resumen navegable |
| Datos insuficientes | Entradas faltantes y funciones que sí están disponibles |
| Versión obsoleta | Informar que cambió el recurso y ofrecer recargar |
| Período cerrado | Mostrar revisión de cierre y acción autorizada relacionada |
| Proceso fallido | Código legible y posibilidad de reintento cuando sea seguro |
| Sin permiso | Mensaje de acceso sin revelar información ajena |

Se requiere navegación por teclado, foco visible, etiquetas asociadas a campos, encabezados correctos en tablas y anuncio de errores importantes. El color no será el único medio para representar variación, estado o error. Los gráficos tendrán tabla o resumen equivalente. El diseño debe comprobarse con importes largos, nombres extensos, filas con errores y pantallas pequeñas.

## 7. Aceptación de interfaz

Una pantalla se considera terminada cuando resuelve sus estados de carga, vacío, error y permiso; conserva el contexto de cálculo; utiliza componentes compartidos; y conduce al resultado correcto del CU correspondiente. Una captura bonita o el funcionamiento aislado de un gráfico no acredita ese recorrido.

El manual previsto se desarrolla en [21](../validacion_y_entrega/21_MANUAL_DE_USUARIO_Y_DEMOSTRACION.md). La comprobación funcional y de accesibilidad se planifica en [18](../validacion_y_entrega/18_PLAN_DE_PRUEBAS_Y_DATOS_DE_REFERENCIA.md). No existen todavía capturas verificadas de la aplicación implementada.

## Fuentes

- **F6:** `Branding_Panaderia_Carlitos_COMPLETO.zip`, paleta, componentes, mapa y demo académica.
- **F3:** `Carlitos_BASE_CONTABLE_AMPLIADA.xlsx`, hojas LEEME, CATALOGO y DIARIO; auditoría resumida en los documentos 04 y 20.
- [Next.js: Project structure](https://nextjs.org/docs/app/getting-started/project-structure), para la relación entre carpetas y páginas.
