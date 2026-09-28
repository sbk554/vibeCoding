-- Supabase 대시보드 > SQL Editor 에서 한 번에 실행하세요.

-- 1) 테이블 ------------------------------------------------------------
create table if not exists public.apartments (
  id           text primary key,
  name         text not null,
  pyeong       int  not null check (pyeong > 0),
  living_area  int  not null check (living_area > 0)
);

create table if not exists public.flooring_materials (
  id               text primary key,
  name             text not null,
  price_per_pyeong int  not null check (price_per_pyeong > 0),
  color            text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  type             text not null check (type in ('wood', 'herringbone', 'stone')),
  texture_url      text,
  feature          text
);

create table if not exists public.consultations (
  id            uuid primary key default gen_random_uuid(),
  apartment_id  text not null references public.apartments(id),
  material_id   text not null references public.flooring_materials(id),
  pyeong        int,
  total_price   bigint,
  customer_name text not null check (char_length(customer_name) between 1 and 50),
  phone         text not null check (phone ~ '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$'),
  notes         text check (char_length(notes) <= 1000),
  status        text not null default 'new' check (status in ('new', 'contacted', 'done')),
  created_at    timestamptz not null default now()
);

-- 2) 견적 금액은 서버가 계산 (클라이언트가 보낸 값은 신뢰하지 않음) ----------
create or replace function public.set_consultation_total()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select a.pyeong, a.pyeong * m.price_per_pyeong
    into new.pyeong, new.total_price
    from public.apartments a, public.flooring_materials m
   where a.id = new.apartment_id and m.id = new.material_id;
  return new;
end $$;

drop trigger if exists trg_consultation_total on public.consultations;
create trigger trg_consultation_total
  before insert on public.consultations
  for each row execute function public.set_consultation_total();

-- 3) RLS: 방문자는 조회(자재/아파트)와 상담 등록(insert)만 가능 --------------
alter table public.apartments         enable row level security;
alter table public.flooring_materials enable row level security;
alter table public.consultations      enable row level security;

create policy "read apartments" on public.apartments
  for select to anon, authenticated using (true);
create policy "read materials" on public.flooring_materials
  for select to anon, authenticated using (true);
create policy "submit consultation" on public.consultations
  for insert to anon, authenticated with check (true);
-- consultations 조회 정책은 일부러 없음 → 상담 내역은 대시보드(관리자)에서만 열람

grant select on public.apartments, public.flooring_materials to anon, authenticated;
grant insert on public.consultations to anon, authenticated;

-- 4) 시드 데이터 -------------------------------------------------------
insert into public.apartments (id, name, pyeong, living_area) values
  ('apt-1', '마포래미안푸르지오', 24, 12),
  ('apt-2', '반포자이', 35, 18),
  ('apt-3', '헬리오시티', 33, 16)
on conflict (id) do nothing;

insert into public.flooring_materials (id, name, price_per_pyeong, color, type, feature) values
  ('mat-1', '내추럴 오크 강마루', 110000, '#d2a679', 'wood', '밝고 따뜻한 톤, 가성비 좋은 강마루'),
  ('mat-2', '딥 월넛 원목마루', 220000, '#5c4033', 'wood', '깊은 색감의 프리미엄 원목'),
  ('mat-3', '화이트 헤링본 마루', 160000, '#f0ebe1', 'herringbone', '클래식한 헤링본 패턴, 화사한 공간'),
  ('mat-4', '모던 스톤 타일마루', 140000, '#9e9e9e', 'stone', '내구성 높은 스톤 질감, 관리 쉬움')
on conflict (id) do nothing;
