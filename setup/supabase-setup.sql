-- =====================================================================
-- LA CASA DEL HINCHA — Configuración de base de datos (Supabase)
-- Pega TODO este contenido en:  Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- PRODUCTOS ----------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  name         text not null,
  description  text default '',
  team         text default '',
  categories   text[] default '{}',   -- Masculino / Femenino / Infantil
  sizes        text[] default '{}',   -- S, M, L, XL, XXL, Niño
  stock        int default 0,
  price        numeric default 0,     -- precio de venta (el que se cobra)
  is_promo     boolean default false,
  price_old    numeric,               -- precio anterior (tachado) si hay promoción
  allow_custom boolean default false, -- permite nombre/número personalizado
  images       text[] default '{}',   -- hasta 3 URLs
  active       boolean default true
);
alter table public.products enable row level security;
drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_all  on public.products;
create policy products_public_read on public.products
  for select using ( active = true );
create policy products_admin_all on public.products
  for all to authenticated using ( true ) with check ( true );

-- ---------- PEDIDOS ----------
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  buyer_name  text not null,
  phone       text default '',
  delivery    text default 'retiro',  -- retiro | envio
  items       jsonb default '[]',     -- [{product_id,name,size,qty,custom_name,custom_number,price}]
  total       numeric default 0,
  note        text default '',
  status      text default 'nuevo'    -- nuevo | en proceso | entregado
);
alter table public.orders enable row level security;
drop policy if exists orders_public_insert on public.orders;
drop policy if exists orders_admin_read    on public.orders;
drop policy if exists orders_admin_write   on public.orders;
create policy orders_public_insert on public.orders
  for insert with check ( true );
create policy orders_admin_read on public.orders
  for select to authenticated using ( true );
create policy orders_admin_write on public.orders
  for update to authenticated using ( true ) with check ( true );
drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
  for delete to authenticated using ( true );

-- ---------- RESEÑAS ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  product_id  uuid references public.products(id) on delete cascade,
  author      text default 'Cliente',
  rating      int default 5,          -- 1 a 5 estrellas
  comment     text default '',
  photo       text,                   -- URL de foto (opcional)
  approved    boolean default true
);
alter table public.reviews enable row level security;
drop policy if exists reviews_public_read   on public.reviews;
drop policy if exists reviews_public_insert on public.reviews;
drop policy if exists reviews_admin_all     on public.reviews;
create policy reviews_public_read on public.reviews
  for select using ( approved = true );
create policy reviews_public_insert on public.reviews
  for insert with check ( true );
create policy reviews_admin_all on public.reviews
  for all to authenticated using ( true ) with check ( true );

-- ---------- AJUSTES (QR de pago, etc.) ----------
create table if not exists public.settings (
  key   text primary key,
  value text default ''
);
alter table public.settings enable row level security;
drop policy if exists settings_public_read on public.settings;
drop policy if exists settings_admin_write on public.settings;
create policy settings_public_read on public.settings
  for select using ( true );
create policy settings_admin_write on public.settings
  for all to authenticated using ( true ) with check ( true );
insert into public.settings (key, value) values
  ('qr_url',''),
  ('qr_note','Escanea el QR, paga el total y luego envía tu comprobante por WhatsApp.')
on conflict (key) do nothing;

-- ---------- ALMACENAMIENTO DE IMÁGENES ----------
-- IMPORTANTE: primero crea 2 buckets PÚBLICOS en Supabase → Storage:
--   1) "productos"   2) "resenas"
-- Luego corre estas políticas:
drop policy if exists productos_read   on storage.objects;
drop policy if exists productos_write  on storage.objects;
drop policy if exists productos_update on storage.objects;
drop policy if exists productos_delete on storage.objects;
drop policy if exists resenas_read     on storage.objects;
drop policy if exists resenas_write    on storage.objects;
create policy productos_read   on storage.objects for select using ( bucket_id = 'productos' );
create policy productos_write  on storage.objects for insert to authenticated with check ( bucket_id = 'productos' );
create policy productos_update on storage.objects for update to authenticated using ( bucket_id = 'productos' );
create policy productos_delete on storage.objects for delete to authenticated using ( bucket_id = 'productos' );
create policy resenas_read     on storage.objects for select using ( bucket_id = 'resenas' );
create policy resenas_write    on storage.objects for insert with check ( bucket_id = 'resenas' );

-- Listo. Tu base de datos está preparada.
