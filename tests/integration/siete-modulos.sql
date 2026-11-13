-- Run with psql -v ON_ERROR_STOP=1. All fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function pg_temp.must_fail(statement text,label text) returns void language plpgsql as $$
declare failed boolean:=false;
begin
  begin execute statement; exception when others then failed:=true; end;
  perform pg_temp.assert_true(failed,label);
end $$;

-- A local catalog may already contain inactive categories; do not reactivate user data.
create temporary table anf_expected_categories on commit drop as
  select count(*) as cantidad from public.categorias where activo;
grant select on anf_expected_categories to authenticated;

insert into auth.users(id) values
('10000000-0000-4000-8000-000000000001'),
('10000000-0000-4000-8000-000000000002'),
('10000000-0000-4000-8000-000000000003');
select pg_temp.assert_true((select not activo and rol='empleado' from public.perfiles where usuario_id='10000000-0000-4000-8000-000000000001'),'new accounts inactive employee');
update public.perfiles set activo=true,rol='administrador' where usuario_id='10000000-0000-4000-8000-000000000001';
update public.perfiles set activo=true where usuario_id in ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003');

set local role anon;
select pg_temp.must_fail('select * from public.ingresos','anonymous income blocked');
select pg_temp.must_fail('select public.anf_reporte(''2026-10-01'',''2026-10-31'')','anonymous RPC blocked');
reset role;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*)=(select cantidad from pg_temp.anf_expected_categories) and bool_and(activo) from public.categorias),'employee reads active categories only');
select pg_temp.assert_true((select count(*)=1 from public.perfiles),'employee only own profile');
select pg_temp.must_fail('insert into public.ingresos(fecha,concepto,monto,categoria_id,solicitud_id) select ''2026-10-01'',''SQL direct'',1,id,gen_random_uuid() from public.categorias limit 1','direct financial DML blocked');
select pg_temp.must_fail('select public.anf_guardar_categoria(null,null,''I99'',''No permitido'',''ingreso'','''',true)','employee category mutation denied');
select pg_temp.assert_true((select count(*)=0 from public.bitacora),'employee audit hidden');

select public.anf_guardar_movimiento('ingreso',null,null,'20000000-0000-4000-8000-000000000001','2026-10-01','Prueba ingreso','5500.00',
  (select id from public.categorias where codigo='I01'),'referencia');
select public.anf_guardar_movimiento('gasto',null,null,'20000000-0000-4000-8000-000000000002','2026-10-02','Prueba gasto','4800.00',
  (select id from public.categorias where codigo='G01'),'');
select pg_temp.assert_true((select count(*)=2 from public.v_movimientos),'employee sees own movements');
select public.anf_guardar_movimiento('ingreso',null,null,'20000000-0000-4000-8000-000000000001','2026-10-01','Prueba ingreso','5500.00',
  (select id from public.categorias where codigo='I01'),'referencia');
select pg_temp.assert_true((select count(*)=2 from public.v_movimientos),'identical retry creates no duplicate');
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',null,null,'20000000-0000-4000-8000-000000000001','2026-10-01','Otro concepto','5500.00',(select id from public.categorias where codigo='I01'),'referencia')$q$,'retry content conflict');
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',null,null,gen_random_uuid(),'2026-10-01','Inválido','-1',(select id from public.categorias where codigo='I01'),'')$q$,'negative amount denied');
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',null,null,gen_random_uuid(),'2026-10-01','Inválido','1.001',(select id from public.categorias where codigo='I01'),'')$q$,'fraction of cent denied');
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',null,null,gen_random_uuid(),'2026-10-01','Inválido','1',(select id from public.categorias where codigo='G01'),'')$q$,'category type mismatch denied');
select pg_temp.assert_true((public.anf_reporte('2026-10-01','2026-10-07')->'resumen'->>'resultado')::numeric=700,'reference interval result');
savepoint caso_informe;
select public.anf_guardar_movimiento('ingreso',null,null,gen_random_uuid(),'2026-10-08','Referencia ampliada ingreso','6500.00',
  (select id from public.categorias where codigo='I01'),'');
select public.anf_guardar_movimiento('gasto',null,null,gen_random_uuid(),'2026-10-08','Referencia ampliada gasto','4800.00',
  (select id from public.categorias where codigo='G01'),'');
select pg_temp.assert_true((public.resumen_financiero('2026-10-01','2026-10-31')->>'ingresos')::numeric=12000,'guide income 12000');
select pg_temp.assert_true((public.resumen_financiero('2026-10-01','2026-10-31')->>'gastos')::numeric=9600,'guide expenses 9600');
select pg_temp.assert_true((public.resumen_financiero('2026-10-01','2026-10-31')->>'resultado')::numeric=2400,'guide result 2400');
select pg_temp.assert_true((public.resumen_financiero('2026-10-01','2026-10-31')->>'porcentaje_gastos')::numeric=80,'guide expense percentage 80');
select pg_temp.assert_true((select count(*)=4 from public.reporte_movimientos('2026-10-01','2026-10-31')),'detail wrapper preserves authorized records');
select pg_temp.assert_true((select count(*)=1 from public.reporte_periodico('2026-10-01','2026-10-31','mes')),'monthly wrapper aggregates period');
select pg_temp.assert_true((select count(*)=1 from public.reporte_periodico('2026-10-01','2026-10-31','anio')),'annual wrapper aggregates period');
rollback to savepoint caso_informe;
select pg_temp.assert_true((public.anf_reporte('2026-10-01','2026-10-31',null,'gasto')->'resumen'->>'resultado')::numeric=-4800,'negative result preserved');
select pg_temp.assert_true(public.anf_reporte('2026-10-01','2026-10-31',null,'gasto')->'resumen'->>'porcentaje_gastos' is null,'expenses without income yield null percentage');
select pg_temp.assert_true((public.anf_reporte('2026-10-01','2026-10-31')->'resumen'->>'porcentaje_gastos')::numeric=87.27,'percentage rounding');
select pg_temp.assert_true(jsonb_typeof(public.anf_reporte('2026-10-01','2026-10-31')->'resumen'->'ingresos')='string','money transport is string');
select pg_temp.assert_true(public.anf_reporte('2025-01-01','2025-01-31')->'resumen'->>'porcentaje_gastos' is null,'zero income percentage null');
select pg_temp.assert_true(jsonb_array_length(public.anf_reporte('2025-01-01','2025-01-03',null,null,'dia')->'periodos')=3,'empty daily periods included');
select pg_temp.must_fail($q$select public.anf_reporte('2026-10-31','2026-10-01')$q$,'inverted range denied');
select pg_temp.must_fail($q$select public.anf_reporte('2000-01-01','2026-10-01')$q$,'oversized range denied');
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',(select id from public.v_movimientos where tipo='ingreso'),9,gen_random_uuid(),'2026-10-01','Prueba ingreso','5500.00',(select id from public.categorias where codigo='I01'),'referencia')$q$,'stale revision denied');

reset role;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.v_movimientos),'other employee cannot read movements');
select pg_temp.assert_true((public.anf_reporte('2026-10-01','2026-10-31')->'resumen'->>'ingresos')::numeric=0,'other employee totals isolated');

reset role;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.assert_true((select count(*)=2 from public.v_movimientos where creado_por='10000000-0000-4000-8000-000000000002'),'administrator sees all test movements');
select pg_temp.assert_true((select count(*)>0 from public.bitacora),'administrator can audit');
select public.anf_anular_movimiento('gasto',(select id from public.v_movimientos where tipo='gasto' and creado_por='10000000-0000-4000-8000-000000000002'),1,'Corrección de prueba');
select pg_temp.assert_true((public.anf_reporte('2026-10-01','2026-10-31')->'resumen'->>'gastos')::numeric=0,'void excluded from totals');
select pg_temp.must_fail($q$select public.anf_anular_movimiento('gasto',(select id from public.v_movimientos where tipo='gasto' and creado_por='10000000-0000-4000-8000-000000000002'),2,'Segunda anulación')$q$,'void final and immutable');
select public.anf_guardar_categoria(id,actualizado_en,codigo,nombre,tipo,descripcion,false) from public.categorias where codigo='I01';
select pg_temp.must_fail($q$select public.anf_guardar_movimiento('ingreso',null,null,gen_random_uuid(),'2026-10-01','Inválido','1',(select id from public.categorias where codigo='I01'),'')$q$,'inactive category denied');
select pg_temp.must_fail($q$select public.anf_guardar_categoria(id,actualizado_en,'I99',nombre,tipo,descripcion,activo) from public.categorias where codigo='I01'$q$,'used category code immutable');
select public.anf_guardar_perfil(usuario_id,actualizado_en,nombre,rol,false) from public.perfiles where usuario_id='10000000-0000-4000-8000-000000000002';
reset role;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.v_movimientos),'inactive profile reads no financial data');
select pg_temp.must_fail($q$select public.anf_reporte('2026-10-01','2026-10-31')$q$,'inactive report denied');
reset role;
set local request.jwt.claim.sub='';
update public.perfiles set rol='empleado' where rol='administrador' and usuario_id<>'10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.must_fail($q$select public.anf_guardar_perfil(usuario_id,actualizado_en,nombre,rol,false) from public.perfiles where usuario_id='10000000-0000-4000-8000-000000000001'$q$,'last active administrator protected');
select pg_temp.must_fail('select * from archivo_anf_20261025.perfiles','archived model unavailable to API users');
reset role;
select pg_temp.must_fail($q$update public.bitacora set motivo='alterado'$q$,'audit immutable even in maintenance session');
rollback;
