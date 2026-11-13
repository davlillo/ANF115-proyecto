# 10 — Contratos y casos de uso

**Proyecto:** Carlitos Finanzas  
**Versión documental:** 0.1 · **Fecha:** 19 de octubre de 2026  
**Estado:** contratos funcionales y técnicos propuestos. CU-01, CU-03, CU-04 y CU-23 tienen implementación y evidencia inicial; CU-02, CU-05 a CU-22 siguen pendientes.

## Contrato vigente de usuarios — siete módulos, 12/11/2026

La planificación contable inferior se conserva como antecedente. Para el alcance
actual prevalece [22](../implementacion/22_RECONSTRUCCION_SIETE_MODULOS.md).

| Operación | Entrada | Garantía |
| --- | --- | --- |
| `usuario`, alta | nombre, correo, contraseña 8–128 caracteres, rol permitido | Administrador activo; Auth solo en servidor; asignación con `anf_guardar_perfil`. Alta completada activa; fallo parcial conserva perfil inactivo. |
| `usuario`, edición | UUID, `versionEsperada`, nombre y rol | Ignora `activo` del navegador y conserva el estado leído en servidor; RPC comprueba versión y último administrador. |
| `usuario_estado` | UUID, `versionEsperada`, booleano `activo` | Administrador activo; ignora nombre/rol del navegador y los lee del perfil vigente antes de llamar a la misma RPC auditada. |
| `consultarUsuario` | UUID; actividad opcional, página | Autorización antes de consultar Auth. UUID inválido o recurso inexistente: `RECURSO_NO_ENCONTRADO`; empleado: `PERMISO_DENEGADO`. Actividad filtrada por actor en PostgreSQL, 50 eventos por página. |

`/usuarios/[id]` solo edita información/rol. `/auditoria/usuarios/[id]` presenta
identidad, actividad y estado. Ambas páginas y sus Actions verifican autorización
en servidor; el cambio de ubicación no elimina RLS ni grants. Los códigos de
error existentes y `Resultado<T>` se mantienen.

## 1. Alcance de los contratos

Los controladores implementarán CU-01 a CU-23. Una página, Action o Route Handler adapta su entrada al mismo caso de uso; no introduce una segunda fórmula o un flujo alternativo sin autorización.

Los argumentos de un CU describen una intención: preparar un asiento, aprobar una versión o emitir un reporte. No admiten nombres arbitrarios de tablas, columnas SQL, roles o estados finales. La firma TypeScript no sustituye la validación de ejecución con schemas ni las restricciones de PostgreSQL.

## 2. Tipos y reglas comunes

```ts
type UUID = string;
type FechaContable = string; // YYYY-MM-DD, fecha real validada.
type Importe = string;      // Decimal canónico con dos posiciones.
type DecimalTexto = string; // Para razones, tasas y resultados internos.

type ContextoServidor = Readonly<{
  usuarioId: UUID;
  empresaId: UUID;
  permisos: readonly string[];
  origenDatos: 'simulado' | 'real';
  requestId: string;
}>;

type ConsultaFinanciera = {
  desde: FechaContable;
  hasta: FechaContable;
  corte: FechaContable;
  base: 'movimiento_periodo' | 'acumulado_ejercicio' | 'saldo_corte';
  politicaId: UUID;
};

type Resultado<T> =
  | { ok: true; datos: T; requestId: string }
  | {
      ok: false;
      error: {
        codigo: string;
        mensaje: string;
        campos?: { ruta: string; codigo: string; mensaje: string }[];
        reintentable: boolean;
      };
      requestId: string;
    };
```

`ContextoServidor` se crea desde identidad y membresía verificadas. No se confía en una estructura con esos campos enviada por el navegador. Si la URL solicita una empresa, el servidor verifica que pueda resolverla como contexto autorizado.

Los importes contables aceptan hasta 16 dígitos enteros y exactamente dos decimales en su forma normalizada. La entrada humana puede normalizarse desde un formato permitido, pero nunca se adivinan separadores ambiguos. Las líneas rechazan importes negativos o no finitos; resultados y desviaciones pueden ser negativos. Las RPC devuelven dinero convertido a texto antes de serializar JSON.

Las operaciones sobre un recurso existente exigen `versionEsperada`. Las mutaciones reintentables exigen `claveIdempotencia`. Esa clave tiene alcance empresa/operación; no es una contraseña. El hash se deriva de la entrada canónica efectivamente procesada, sin aceptar como prueba un hash del navegador que no se haya comprobado.

El reintento comprueba identidad y permiso actuales y busca la operación previa antes de aplicar las precondiciones de una mutación nueva. Misma clave y entrada devuelve el resultado original incluso si esa operación incrementó la versión o cerró el período; no vuelve a ejecutarse. La misma clave con otra entrada devuelve conflicto. Campos de transporte como un nuevo `requestId` no alteran el hash de la intención de negocio.

La consulta financiera exige fechas coherentes y base temporal explícita. Un estado de situación usa saldo al corte; los flujos de resultados y patrimonio usan su intervalo correspondiente. Una petición que combine bases incompatibles se rechaza o devuelve un diagnóstico de comparabilidad, según el CU.

## 3. Catálogo de 23 casos de uso

| CU y función | Entrada específica | Validaciones y permiso | Salida y efecto |
| --- | --- | --- | --- |
| **CU-01 `resolverAcceso`** | Empresa solicitada opcional; sesión del contexto HTTP | Identidad verificada, perfil y membresía activos | Contexto mínimo, destinos y capacidades; ningún dato financiero sin acceso |
| **CU-02 `gestionarUsuario`** | Operación crear/cambiar_rol/desactivar/reactivar; usuario, rol permitido, versión y clave | `usuarios.gestionar`; no autoasignación por DML; control de alcance | Usuario/membresía y resultado parcial de Auth si aplica; auditoría |
| **CU-03 `guardarCuenta`** | Código, nombre, jerarquía, clase, naturaleza, rubro, vigencia, versión y motivo de cambio | `catalogo.publicar`; jerarquía sin ciclos; cuenta/rubro de empresa; restricciones de cuenta utilizada | Cuenta publicada, revisión de catálogo y auditoría |
| **CU-04 `gestionarPeriodo`** | Consultar períodos o crear año/mes; versión y clave en mutación | Lectura o `periodos.gestionar`; calendario válido y único | Período nuevo abierto o lista; cerrar/reabrir solo por CU-21/22 |
| **CU-05 `cargarImportacion`** | Archivo, formato/mapeo admitido, origen y clave | `importaciones.preparar`; límites, firma/formato y procedencia | Lote recibido y metadatos del archivo privado |
| **CU-06 `validarLote`** | Lote, versión esperada, mapeo y correcciones normalizadas permitidas con motivo | `importaciones.preparar`; originales preservados; revisión vigente de catálogo | Estado listo/con_errores, filas, errores y totales; no crea asientos |
| **CU-07 `confirmarLote`** | Lote, versión esperada y clave | `importaciones.preparar` y `asientos.preparar`; todo lote válido, períodos abiertos, duplicados controlados | Todos los asientos como borradores, IDs y nueva versión; todo o nada |
| **CU-08 `guardarBorrador`** | Modo guardar/validar/descartar; cabecera y líneas o ID; versión, clave y motivo cuando aplique | `asientos.preparar`; restricciones básicas, período abierto; validación exige cuadre; descarte solo no contabilizado | Borrador, validado o marca de descarte; diferencia y errores; auditoría |
| **CU-09 `aprobarAsientos`** | IDs con versión esperada de cada uno y clave | `asientos.aprobar`; conjunto íntegro, cuentas vigentes, período abierto, sin descarte | Valida y contabiliza todo el conjunto; revisiones y auditoría |
| **CU-10 `revertirAsiento`** | Original, versión, fecha de reversión, motivo y clave | `asientos.revertir`; original contabilizado, sin reversión directa previa, período destino abierto | Contrapartida contabilizada y vínculo; original conservado |
| **CU-11 `consultarDiario`** | Fechas, período, cuenta, estado, origen, cursor e incluirDescartados | `finanzas.leer`; filtros válidos y paginación limitada | Cabeceras/líneas autorizadas, totales de consulta y cursor |
| **CU-12 `generarEstadosHistoricos`** | Consulta financiera y selección de comprobación/resultados/balance/patrimonio | `finanzas.leer`; base coherente, entradas capturadas y clasificación completa | Estados conciliados o incidencias; corte, política y revisiones |
| **CU-13 `calcularAnalisis`** | Consulta, indicadores y comparaciones solicitadas | `finanzas.leer`; operandos disponibles y comparabilidad declarada | Indicadores, horizontal/vertical, fórmulas, procedencia y advertencias |
| **CU-14 `guardarPresupuesto`** | Ejercicio, versión, líneas, operación guardar/enviar_revision/crear_version, clave | `presupuestos.preparar`; rubros/meses válidos; aprobado no editable | Versión y estado borrador/en_revision; nueva versión cuando corresponda |
| **CU-15 `aprobarPresupuesto`** | Presupuesto, versión, decisión aprobar/rechazar, motivo y clave | `presupuestos.aprobar`; versión en revisión y completa; motivo para rechazo | Aprobado/rechazado, actor y decisión preservados |
| **CU-16 `compararPresupuesto`** | Versión de presupuesto e intervalo real comparable | `finanzas.leer`; rubros, moneda y bases compatibles | Real, plan, diferencia, porcentaje disponible e interpretación por rubro |
| **CU-17 `guardarEscenario`** | Método, versión base, parámetros, presupuesto opcional, corte/horizonte, clave | `escenarios.ejecutar`; supuestos explícitos y datos suficientes para método | Nueva versión y pronóstico preliminar con cobertura y evaluación |
| **CU-18 `ejecutarProyeccion`** | Versión de escenario, saldo inicial, calendarios/puente referenciados, política y clave | `escenarios.ejecutar`; entradas completas y partida doble futura | Ejecución integrada, movimientos y tres estados por mes; incidencias si no publicable |
| **CU-19 `emitirReporte`** | Tipo/formato, referencia de ejecución o versión, opciones permitidas y clave | `reportes.exportar`; fuente autorizada y reproducible | Reporte pendiente/generando/listo/fallido; archivo de la misma fuente |
| **CU-20 `descargarReporte`** | ID de reporte y formato existente | `reportes.exportar`; membresía vigente, empresa correcta, estado listo y fuente protegida | Archivo recompuesto desde captura, motor y plantilla versionados, con nombre y tipo controlados |
| **CU-21 `cerrarPeriodo`** | Período, versión, motivo y clave | `periodos.cerrar`; período abierto, conciliado y sin pendientes no resueltos | Snapshot de cierre, estado cerrado, revisión y auditoría |
| **CU-22 `reabrirPeriodo`** | Período, versión, motivo obligatorio y clave | `periodos.reabrir`; cerrado y referencia al cierre vigente | Período abierto, nueva revisión y cierre anterior conservado |
| **CU-23 `consultarAuditoria`** | Fechas, actor, entidad, acción y cursor | `auditoria.leer`; filtros y empresa autorizados | Eventos paginados, motivo, versiones y referencia |

La autenticación de credenciales se adapta mediante Supabase Auth y luego CU-01 resuelve el acceso financiero. CU-02 no promete atomicidad entre crear una identidad Auth y asignar su membresía; se preserva el resultado parcial y se puede reintentar sin duplicar identidad.

Una versión presupuestaria aprobada o rechazada conserva su contenido y decisión. CU-14 retoma cambios creando otra versión en borrador vinculada a la anterior; no borra comentarios o aprobación histórica.

## 4. DTO de importación y borrador

Un error de importación identifica su ubicación y no se limita a “archivo inválido”:

```json
{
  "hoja": "DIARIO",
  "fila": 24,
  "columna": "Cuenta",
  "asientoExterno": "AS-0008",
  "codigo": "CUENTA_NO_MOVIMIENTO",
  "mensaje": "La cuenta seleccionada es de agrupación.",
  "bloqueaConfirmacion": true
}
```

La vista previa devuelve `loteId`, `estado`, `version`, `hashArchivo`, `versionMapeo`, revisiones de validación, número de filas, número de asientos, debe, haber y cantidad de errores. Las filas se paginan sin alterar esos totales globales.

La entrada de borrador contiene fecha, concepto, período y líneas con cuenta, debe, haber y procedencia. Se exige al menos dos líneas con cuenta y formato válidos. Guardar desbalanceado devuelve diferencia y estado borrador; validar exige debe igual a haber. Cambiar contenido de un validado vuelve a borrador.

El modo descartar conserva cabecera, líneas, origen e identificadores y escribe `descartado_en`, `descartado_por` y `motivo_descarte`. No añade un cuarto estado contable. Un descartado no se edita ni aprueba y no bloquea el cierre; sigue visible mediante filtro y en la procedencia de su lote.

## 5. Aprobación, reversión y cierre

CU-09 puede recibir borradores o validados. La RPC revalida cada asiento, completa la transición lógica a validado y contabiliza el conjunto en la misma transacción. Esto permite aprobar un lote de múltiples asientos sin exigir validación manual individual en otra pantalla. La operación no modifica líneas para hacerlas cuadrar.

CU-10 puede corregir un original de un período cerrado mediante una contrapartida en un período abierto permitido. El período de destino debe estar abierto; el original y su período conservan la historia. La consulta suma original y reversión, y no excluye el primero por mostrar una etiqueta de revertido.

CU-21 comprueba que no existan borradores pendientes no descartados ni incidencias que impidan conciliar. Los descartados conservados no tienen efecto contable. La RPC captura los saldos bajo la revisión que cierra. El cierre del MVP no crea asientos automáticos de cierre anual.

## 6. DTO de cálculo y autoridad de los resultados

Los resultados de CU-12, CU-13, CU-16 y CU-18 contienen como mínimo:

- Empresa, origen, moneda, consulta temporal y corte.
- Revisiones de datos y catálogo, política y versión de fórmulas.
- Entradas normalizadas o referencia a su captura inmutable y hash.
- Valores decimales como texto, unidad y estado de cálculo.
- Calidad, aproximaciones, faltantes y procedencia.
- Conciliaciones y referencias de cuentas cuando existan.

Para un indicador, `valor` puede ser nulo y el estado explicar datos insuficientes o denominador no calculable. Un indicador calculable con una aproximación puede conservar valor y advertencia. El contrato detallado del motor está en [11](11_MOTOR_FINANCIERO_E_IMPORTACIONES.md).

**El navegador no suministra los totales finales de un estado o indicador como datos confiables.** Las RPC de captura reciben consulta y referencias, y obtienen sus entradas desde la base. Los servicios del servidor calculan desde esa captura. La lectura y exportación deben recomponer o verificar los resultados con el motor determinista y la versión capturada, sin tratar un JSON remitido por un cliente como autoridad financiera.

La decisión inicial es derivar los resultados en cada lectura o emisión, sin habilitar una escritura pública de resultados finales. Si se utiliza una columna de resultados como caché, no reemplaza la captura y el recálculo verificable. Toda publicación debe comprobar coherencia con su fuente.

CU-20 genera el archivo desde la captura protegida y las versiones de motor y plantilla asociadas al reporte. La copia de Storage no se entrega por el solo hecho de que un cliente haya registrado `listo`, una ruta o un hash. Si la versión necesaria no está disponible, se devuelve un error identificable y no se sustituyen silenciosamente las fórmulas por las actuales. La reproducción exigida es de contenido, cifras y contexto; no se promete identidad binaria entre generadores sin haberla comprobado.

## 7. RPC financieras obligatorias

Firmas lógicas propuestas; la migración fijará nombres de tipos SQL y validará el contenido de los comandos. Los parámetros `jsonb` representan estructuras cerradas, no parches arbitrarios.

| RPC | Firma lógica | Garantía |
| --- | --- | --- |
| `confirmar_lote` | empresa UUID, lote UUID, versión INTEGER, clave TEXT | Inserta todo el lote como borradores y marca confirmado |
| `guardar_borrador` | empresa UUID, comando JSONB, clave TEXT | Cabecera y líneas juntas; modo guardar/validar |
| `descartar_borrador` | empresa UUID, asiento UUID, versión INTEGER, motivo TEXT, clave TEXT | Marca administrativa conservando contenido |
| `aprobar_asientos` | empresa UUID, IDs UUID[], versiones JSONB, clave TEXT | Validación y contabilización de todo el conjunto |
| `revertir_asiento` | empresa UUID, original UUID, versión INTEGER, fecha DATE, motivo TEXT, clave TEXT | Contrapartida trazable en período permitido |
| `cerrar_periodo` | empresa UUID, período UUID, versión INTEGER, motivo TEXT, clave TEXT | Conciliación, snapshot y cierre |
| `reabrir_periodo` | empresa UUID, período UUID, versión INTEGER, motivo TEXT, clave TEXT | Reapertura con historia conservada |

Las operaciones de catálogo, membresías, presupuestos y escenarios utilizan RPC específicas: `guardar_cuenta`, `crear_periodo`, `gestionar_membresia`, `guardar_presupuesto`, `decidir_presupuesto` y `guardar_escenario`. Los cambios de lote, captura de ejecución y estado de reporte también tendrán firmas estrechas que validen transición, empresa, referencias y versión; no se resolverán concediendo DML abierto.

Todas las RPC de escritura cumplen el perfil definer acotado de [08](08_AUTENTICACION_PERMISOS_Y_AUDITORIA.md). Se bloquea empresa → períodos ordenados → recurso, se revalidan estado y versión, y se registra auditoría en la misma transacción. Una excepción inesperada se propaga para producir rollback.

La lectura mediante funciones invoker sigue siendo válida cuando el llamador dispone de SELECT bajo RLS. El diseño no mezcla esa elección con las RPC de escritura que necesitan los grants del rol interno.

## 8. Entradas HTTP iniciales

| Entrada | Contrato | Respuestas previstas |
| --- | --- | --- |
| `POST /api/importaciones` | Multipart con archivo, origen, formato/mapeo y clave de idempotencia | 201 lote registrado; 200 reintento de la misma operación; 400/413/415/422 para entrada o formato; 401/403 por acceso; 409 por conflicto |
| `GET /api/reportes/[id]/archivo` | UUID validado y sesión del actor | 200 archivo listo; 401/403/404 según acceso/recurso; 409 si aún no disponible; 503 si falla Storage |
| `GET /api/health` | Sin parámetros financieros | 200 estado básico; 503 si la comprobación definida no está disponible; sin secretos ni datos de negocio |

Los errores de validación de filas se representan en el lote: un archivo admitido puede producir un lote `con_errores` y una respuesta de registro satisfactoria. Un archivo que ni siquiera cumple el formato de entrada se rechaza antes de presentarlo como validación contable terminada.

En el primer diseño, la carga y validación se procesan con límites en el servidor. Si se responde antes de terminar, debe existir un mecanismo de ejecución y recuperación que continúe el trabajo; no se considera suficiente lanzar una promesa sin esperar. No se declara una cola implementada en este paquete.

## 9. Server Actions, paginación y errores

Las Actions de usuarios, catálogo, diario, presupuestos, escenarios y cierre delegan en los CU correspondientes. Devuelven `Resultado<T>` y revalidan la vista tras éxito. No envían detalles de SQL o trazas al navegador.

Las listas usan orden estable por fecha e ID y cursor opaco. El tamaño máximo se centraliza en `config/limites.ts`. Los totales de consulta se calculan sobre todo el filtro autorizado, no solo sobre la página recibida.

| Código de error | Significado | Tratamiento esperado |
| --- | --- | --- |
| `VALIDACION_ENTRADA` | Formato o campo inválido | Corregir campos; HTTP 400/422 |
| `NO_AUTENTICADO` | Falta identidad válida | Iniciar sesión; HTTP 401 |
| `PERMISO_DENEGADO` | Falta permiso de operación | Informar acceso; HTTP 403 |
| `RECURSO_NO_ENCONTRADO` | Recurso inexistente o fuera del ámbito visible | HTTP 404 |
| `PERIODO_CERRADO` | Mutación en destino cerrado | Revisar período; HTTP 409 |
| `VERSION_OBSOLETA` | Recurso cambiado desde lectura | Recargar y revisar; HTTP 409 |
| `DUPLICADO` | Identificador contable ya registrado | Revisar procedencia; HTTP 409 |
| `IDEMPOTENCIA_CONFLICTO` | Clave reutilizada para otra entrada | Nueva intención debe usar otra clave; HTTP 409 |
| `LOTE_NO_LISTO` | Errores, revisión o estado impiden confirmar | Revalidar; HTTP 409 |
| `DESCUADRE` | No cumple partida doble o conciliación | Corregir entradas; HTTP 422 |
| `DATOS_INSUFICIENTES` | Faltan entradas para operación completa | Detallar faltantes; HTTP 422 cuando bloquea el CU |
| `ARCHIVO_NO_DISPONIBLE` | Reporte todavía no listo | Mostrar estado; HTTP 409 |
| `LIMITE_EXCEDIDO` | Tamaño, filas o recursos sobre límite | Reducir entrada; HTTP 413/422 |
| `INTEGRACION_NO_DISPONIBLE` | Dependencia temporalmente fallida | Reintento controlado; HTTP 503 |
| `ERROR_INTERNO` | Fallo inesperado sin resultado confirmado | ID de solicitud para diagnóstico; HTTP 500 |

`datos_insuficientes` como estado de un indicador no convierte por sí solo en error toda la respuesta de análisis: otros indicadores pueden calcularse. Las Actions usan los mismos códigos semánticos aunque no expongan un código HTTP al componente.

## 10. Criterio de conformidad

Un contrato queda implementado cuando valida entradas y permisos, preserva la atomicidad prometida, devuelve un DTO estable, permite reintento sin duplicar efectos y registra evidencia real de los casos aceptados y rechazados. Los casos de prueba correspondientes se mantienen en [18](../validacion_y_entrega/18_PLAN_DE_PRUEBAS_Y_DATOS_DE_REFERENCIA.md); el estado actual de todos los CU de aplicación es pendiente.

## Fuentes y referencias

- [Next.js: Data security](https://nextjs.org/docs/app/guides/data-security), fronteras de acceso y acciones.
- [Next.js: Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend), adaptadores HTTP y llamadas internas.
- [Supabase: Database functions](https://supabase.com/docs/guides/database/functions), funciones e invocación RPC.
- [03 Requisitos](../negocio/03_REQUERIMIENTOS_Y_CRITERIOS_DE_ACEPTACION.md), [07 Modelo](07_MODELO_DE_DATOS_Y_MIGRACIONES.md), [08 Seguridad](08_AUTENTICACION_PERMISOS_Y_AUDITORIA.md).
