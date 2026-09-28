-- (선택) 신청 내역 페이지용 추가 SQL — schema.sql 실행 후 SQL Editor 에서 실행하세요.
--
-- schema.sql 은 consultations 에 SELECT 정책이 없어 방문자가 테이블을 직접 조회할 수 없습니다.
-- 이 정책은 그대로 두고, "이름 + 연락처"가 모두 일치하는 본인 신청 건만 돌려주는
-- SECURITY DEFINER 함수를 추가합니다. (전체 목록 노출 없음)
--
-- 호출: POST /rest/v1/rpc/get_my_consultations
--       body: { "p_name": "홍길동", "p_phone": "010-1234-5678" }

create or replace function public.get_my_consultations(p_name text, p_phone text)
returns table (
  id            uuid,
  apartment_id  text,
  apartment_name text,
  material_id   text,
  material_name text,
  pyeong        int,
  total_price   bigint,
  customer_name text,
  phone         text,
  notes         text,
  status        text,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.apartment_id, a.name, c.material_id, m.name,
         c.pyeong, c.total_price, c.customer_name, c.phone, c.notes,
         c.status, c.created_at
    from public.consultations c
    left join public.apartments a         on a.id = c.apartment_id
    left join public.flooring_materials m on m.id = c.material_id
   where c.customer_name = btrim(p_name)
     and regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g')
   order by c.created_at desc
   limit 50;
$$;

revoke all on function public.get_my_consultations(text, text) from public;
grant execute on function public.get_my_consultations(text, text) to anon, authenticated;
