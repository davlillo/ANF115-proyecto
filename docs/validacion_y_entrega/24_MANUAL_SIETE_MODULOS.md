# Manual: control de ingresos y gastos

## Entrar y salir

Abrir `/login` y usar la cuenta asignada. El perfil debe estar activo; una sesión
válida no concede acceso si el administrador desactivó el perfil. No se elige el
rol desde el navegador. «Mi perfil» muestra nombre, rol y estado. «Cerrar sesión»
está en la barra lateral y en el encabezado de escritorio.

Si olvidó su contraseña, usar «¿Olvidó su contraseña?» y consultar el enlace
en el correo local Mailpit (`http://127.0.0.1:54324`). El enlace es de un solo uso
y caduca; permite elegir una contraseña nueva y vuelve al acceso. La respuesta
de solicitud no revela si el correo pertenece a una cuenta existente. Auth
limita los envíos; esperar antes de repetir una solicitud.

## Registrar ingresos o gastos

En cada módulo puede abrir **Guía paso a paso**. Muestra tres pasos con
«Anterior», «Siguiente» y accesos a los controles de esa pantalla. También puede
elegir cualquier paso o cerrar la guía: no bloquea ni obliga a repetir tareas.

1. Abrir el módulo y completar concepto, monto USD, fecha y categoría compatible.
2. Usar punto decimal, sin separadores de miles: `1250.50`. La referencia es
   opcional. El importe debe ser positivo y tener como máximo dos decimales.
3. Guardar y esperar «Operación confirmada». Un error no confirma el guardado;
   los campos se conservan para corregirlos.
4. Tras confirmar, el formulario se limpia automáticamente y queda listo para
   otra captura, con fecha sugerida y una solicitud nueva.

La misma solicitud de alta se conserva al reintentar; no se crean duplicados.
Una categoría inactiva no puede clasificarse en una nueva captura.

## Anular

«Anular» exige un motivo de 5–500 caracteres y confirmación. Es definitivo: el
registro se conserva, deja de formar parte de los indicadores y no admite otra
edición ni reactivación. La interfaz no ofrece corrección después del alta. El
empleado solo puede anular sus movimientos; el administrador puede anular los
movimientos autorizados del negocio.
Después de confirmar se cierra el desplegable. «Ver detalle» permite consultar
el motivo, autor e instante de anulación cuando sea necesario.

## Categorías

El administrador puede crear, editar y desactivar categorías. El código comienza
por I (ingreso) o G (gasto). Una categoría utilizada no puede cambiar código o
tipo; desactivarla conserva el historial. En este módulo el empleado solo
consulta categorías activas. El filtro «Mostrar» permite consultar todas, solo
ingresos o solo gastos. Cada tarjeta explica qué
cobro o pago corresponde a la categoría; se trata del catálogo operativo de 26
categorías, no del catálogo contable histórico de 47 cuentas. El administrador
también puede filtrar activas o inactivas. El interruptor de cada tarjeta activa
o desactiva la categoría mediante una operación auditada. «Nueva categoría» está
en la barra de filtros. El alta y «Editar» abren un modal centrado; la edición no
permite guardar si ningún campo cambió. El modal se cierra después del éxito.

## Usuarios

Solo un administrador activo puede crear cuentas y modificar nombre o rol.
Las cuentas se crean mediante Supabase Auth desde el servidor, nunca con claves
administrativas en el navegador. La contraseña debe tener entre 8 y 128
caracteres. El alta completada activa la cuenta con el rol elegido.

La tabla permite buscar y filtrar por rol/estado. El botón «Gestionar» abre
`/usuarios/[id]` para editar nombre y rol, sin menú de tres puntos ni interruptor
de estado. La identidad, actividad y activación/desactivación se consultan en
Seguridad y bitácora. No existe «Eliminar usuario».

En Seguridad y bitácora, la columna Actor muestra el nombre registrado de la
persona. Los eventos sin actor humano se identifican como «Sistema»; el UUID se
mantiene únicamente como referencia técnica interna.

Si falla la asignación después de crear la identidad, el mensaje indica que
quedó pendiente: buscarla en Seguridad y bitácora y completar su activación, sin
repetir el alta. El sistema impide desactivar o degradar al último administrador
activo.

## Panel y reportes

Aplicar fechas inicial/final, categoría y agrupación temporal. El rango incluye
ambos extremos y no puede superar una diferencia de 3660 días. «Vigentes» y
«Anulados» filtran el listado paginado; no alteran los indicadores, que excluyen
siempre los anulados. El panel presenta cuatro indicadores y cuatro gráficos:
ingresos, gastos, resultado y porcentaje de gastos por día, mes o año. «Ver datos
del gráfico» muestra sus valores exactos. No tiene tabla de movimientos; para
consultar registros individuales, usar Ingresos, Gastos o Reportes. Solo Panel y
Reportes muestran las tarjetas de indicadores. La paginación no cambia los
totales del filtro financiero. Se completan períodos vacíos.

Si ingresos = 0, el porcentaje de gastos es «No aplica»; no es cero por defecto.
Un resultado negativo se muestra con signo. El resultado representa cobros menos
pagos operativos, no utilidad contable por devengo ni saldo bancario.

Los gráficos usan Apache ECharts. «Líneas» muestra la evolución y «Barras» permite
comparar períodos. Para consultar un valor, use el puntero o toque un punto.
También puede enfocar el gráfico con Tab y recorrer sus períodos con las flechas
izquierda/derecha; Inicio/Fin van a los extremos. El lector de pantalla anuncia
el valor seleccionado. En intervalos largos aparece un control inferior para
ampliar una parte del gráfico. Esto no modifica los filtros ni los totales.
«Ver datos del gráfico» siempre conserva los importes exactos, incluso si no
carga la visualización. El botón «Reintentar» vuelve a intentar cargar el motor.

No hay exportación PDF/XLSX habilitada. Es complementaria según la guía.

## Seguridad y bitácora

«Acceso de usuarios» permite buscar una cuenta y abrir «Ver detalle y actividad»
en `/auditoria/usuarios/[id]`: identidad, rol, estado de acceso y actividad de ese
actor, con paginación. El interruptor activa o desactiva la cuenta. Una sesión
ya iniciada tampoco puede operar una vez desactivada.

En «Bitácora general», el administrador consulta actor, instante con zona
horaria, entidad, acción y valores antes/después. Los eventos se crean en la misma
transacción del cambio.
No se editan ni se borran. La tabla no contiene contraseñas ni tokens. Los
eventos de sesión pertenecen a Auth, no se presentan como eventos de esta tabla.

## Respaldo y recuperación local

Antes de actualizar, generar un archivo fuera del repositorio/public con
`pg_dump -Fc` y conservarlo protegido. El respaldo de esta reconstrucción incluye
esquema, datos y Auth. Restaurar en **otra base**, nunca sobre `postgres` activa:

```bash
docker exec supabase_db_carlitos-finanzas createdb -U supabase_admin NOMBRE_BASE_SEPARADA
docker exec supabase_db_carlitos-finanzas pg_restore -U supabase_admin -d NOMBRE_BASE_SEPARADA --exit-on-error /RUTA/RESPALDO.dump
```

Para un entorno recién creado también hacen falta los roles/servicios de
Supabase; un dump de una base no es un respaldo completo de todo Docker. Comparar
recuentos, permisos y un conjunto financiero conocido antes de dar por válida
la recuperación. La prueba del 25/10 restauró en una base distinta del mismo
clúster, no en otro equipo.
