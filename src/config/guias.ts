import { rutas } from "@/config/rutas";
import type { GuiaFlujo } from "@/types/guias";

export const guiasFinancieras = {
  panel: {
    titulo: "Entiende tus finanzas",
    pasos: [
      { titulo: "Registra lo que ocurre", descripcion: "Guarda las ventas en Ingresos y los pagos en Gastos. Cada movimiento necesita concepto, monto, fecha y categoría.", href: rutas.ingresos, accion: "Ir a ingresos" },
      { titulo: "Elige qué comparar", descripcion: "Selecciona las fechas y una categoría si la necesitas. Agrupa por día, mes o año y pulsa Aplicar filtros.", href: "#filtros-financieros", accion: "Elegir período" },
      { titulo: "Explora el resultado", descripcion: "Alterna líneas y barras, consulta un punto o abre Ver datos del gráfico para leer el importe exacto. En Reportes encontrarás el detalle.", href: rutas.reportes.lista, accion: "Ver reportes" },
    ],
  },
  ingreso: {
    titulo: "Registra un ingreso sin perderte",
    pasos: [
      { titulo: "Completa la captura", descripcion: "Describe la venta, escribe el monto con punto decimal y comprueba la fecha. Selecciona la categoría que mejor explica el ingreso.", href: "#nueva-captura", accion: "Completar ingreso" },
      { titulo: "Guarda y espera la confirmación", descripcion: "Pulsa Guardar ingreso una sola vez. Si hay un error, corrige el campo indicado: los datos se conservan. Tras el éxito, el formulario queda limpio para otro ingreso." },
      { titulo: "Comprueba el registro", descripcion: "Busca el movimiento en la tabla. Si cometiste un error, anúlalo con un motivo y registra el correcto: la anulación es definitiva.", href: "#detalle-movimientos", accion: "Revisar movimientos" },
    ],
  },
  gasto: {
    titulo: "Registra un gasto paso a paso",
    pasos: [
      { titulo: "Identifica el pago", descripcion: "Describe qué pagaste, escribe un monto positivo y comprueba la fecha. La categoría debe explicar el uso del dinero.", href: "#nueva-captura", accion: "Completar gasto" },
      { titulo: "Confirma el guardado", descripcion: "Pulsa Guardar gasto y espera Operación confirmada. Un mensaje de error no significa que se haya guardado: corrige los campos sin volver a empezar." },
      { titulo: "Revisa el efecto", descripcion: "Comprueba el gasto en la tabla. Los movimientos anulados conservan su historial, pero no se incluyen en los indicadores.", href: "#detalle-movimientos", accion: "Revisar movimientos" },
    ],
  },
  reportes: {
    titulo: "Prepara un reporte útil",
    pasos: [
      { titulo: "Define el alcance", descripcion: "Elige las fechas inicial y final. Puedes limitar el resultado a una categoría y agruparlo por día, mes o año.", href: "#filtros-financieros", accion: "Ajustar filtros" },
      { titulo: "Lee los totales", descripcion: "Los indicadores incluyen todos los movimientos vigentes del filtro, no solo la página visible. Si no hay ingresos, el porcentaje muestra No aplica." },
      { titulo: "Contrasta el detalle", descripcion: "Revisa los períodos y la tabla de movimientos. El filtro de estado solo cambia el detalle; los anulados nunca se suman a los indicadores.", href: "#detalle-movimientos", accion: "Ver el detalle" },
    ],
  },
} satisfies Record<string, GuiaFlujo>;

export const guiasAdministracion = {
  usuarios: {
    titulo: "Crea y organiza las cuentas",
    pasos: [
      { titulo: "Registra la cuenta", descripcion: "Abre Registrar usuario y completa nombre, correo, contraseña y rol. La contraseña admite entre 8 y 128 caracteres.", href: "#registrar-usuario", accion: "Ir al registro" },
      { titulo: "Edita la información", descripcion: "Busca la cuenta y elige Gestionar para cambiar nombre o rol. Guardar cambios se habilita cuando modificas un campo." },
      { titulo: "Administra el acceso aparte", descripcion: "Para activar o desactivar una cuenta, o consultar su actividad, abre Seguridad y bitácora. No es necesario volver a crearla.", href: rutas.auditoria, accion: "Ir a seguridad" },
    ],
  },
  categorias: {
    titulo: "Clasifica cada movimiento",
    pasos: [
      { titulo: "Busca antes de crear", descripcion: "Filtra por ingreso o gasto y lee la descripción de cada tarjeta. Comprueba que no exista una categoría para el mismo uso." },
      { titulo: "Crea o ajusta la categoría", descripcion: "Nueva categoría abre un formulario centrado. Usa un código I para ingresos o G para gastos y una descripción que ayude a elegirla.", href: "#nueva-categoria", accion: "Ir a nueva categoría" },
      { titulo: "Conserva el historial", descripcion: "Editar permite mejorar nombre y descripción. Si ya tiene movimientos, su código y tipo no cambian. Desactivar evita nuevas capturas, sin borrar las anteriores." },
    ],
  },
  categoriasConsulta: {
    titulo: "Encuentra la categoría correcta",
    pasos: [
      { titulo: "Elige ingreso o gasto", descripcion: "Usa Mostrar para consultar las categorías del movimiento que vas a registrar." },
      { titulo: "Lee la descripción", descripcion: "Cada tarjeta explica cuándo usar esa categoría. Solo se muestran las activas que puedes consultar." },
      { titulo: "Vuelve a la captura", descripcion: "Selecciona esa categoría al guardar tu ingreso o gasto. Si ninguna corresponde, solicita ayuda a un administrador.", href: rutas.ingresos, accion: "Ir a ingresos" },
    ],
  },
  bitacora: {
    titulo: "Gestiona el acceso con seguridad",
    pasos: [
      { titulo: "Encuentra a la persona", descripcion: "En Acceso de usuarios, busca por nombre o correo y abre Ver detalle y actividad." },
      { titulo: "Revisa antes de cambiar", descripcion: "Comprueba la identidad y el rol. El interruptor activa o desactiva el acceso; una cuenta inactiva no puede operar aunque conserve una sesión iniciada." },
      { titulo: "Consulta la evidencia", descripcion: "La actividad individual muestra las acciones de esa persona. Bitácora general permite consultar los cambios confirmados del sistema. Los registros no se editan ni se borran." },
    ],
  },
} satisfies Record<string, GuiaFlujo>;
