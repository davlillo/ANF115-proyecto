-- Activa una cuenta como administrador en produccion.
--
-- El disparador anf_alta_perfil crea el perfil INACTIVO al registrarse en Auth.
-- Hasta ejecutar esto, la persona no puede operar aunque tenga sesion valida.
--
-- Uso: reemplazar el correo y ejecutar en el SQL Editor de Supabase como
-- postgres. Se ejecuta una sola vez por cuenta.

update public.perfiles p
set rol = 'administrador',
    activo = true
from auth.users u
where u.id = p.usuario_id
  and lower(u.email) = lower('REEMPLAZAR@dominio.com')
  and p.activo = false;

-- Confirmacion: debe devolver una fila con rol administrador y activo=true.
select p.usuario_id, u.email, p.nombre, p.rol, p.activo, p.actualizado_en
from public.perfiles p
join auth.users u on u.id = p.usuario_id
order by p.creado_en;
