create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  image text not null,
  name text not null,
  rating jsonb not null default '{"stars": 0, "count": 0}'::jsonb,
  price_cents integer not null check (price_cents >= 0),
  keywords text[] not null default '{}',
  type text,
  size_chart_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 99),
  delivery_option_id text not null default '1' check (delivery_option_id in ('1', '2', '3')),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'preparing' check (status in ('preparing', 'shipped', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  product_image text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99),
  delivery_option_id text not null check (delivery_option_id in ('1', '2', '3')),
  estimated_delivery_at date not null
);

create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
  on public.products for select to anon, authenticated using (true);

drop policy if exists "Users manage their own cart" on public.cart_items;
create policy "Users manage their own cart"
  on public.cart_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users read their own orders" on public.orders;
create policy "Users read their own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users read their own order items" on public.order_items;
create policy "Users read their own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.orders, public.order_items to authenticated;

create or replace function public.place_order_from_cart()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_order_time timestamptz := now();
  v_item_count integer;
  v_subtotal integer;
  v_shipping integer;
  v_tax integer;
  v_total integer;
  v_order jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select count(*)
    into v_item_count
    from public.cart_items
    where user_id = v_user_id;

  if v_item_count = 0 then
    raise exception 'Your cart is empty';
  end if;

  select
    sum(products.price_cents * cart_items.quantity)::integer,
    sum(case cart_items.delivery_option_id
      when '1' then 0
      when '2' then 499
      when '3' then 999
    end)::integer
    into v_subtotal, v_shipping
    from public.cart_items
    join public.products on products.id = cart_items.product_id
    where cart_items.user_id = v_user_id;

  v_tax := round((v_subtotal + v_shipping)::numeric * 0.10)::integer;
  v_total := v_subtotal + v_shipping + v_tax;

  insert into public.orders (id, user_id, total_cents, status, created_at)
    values (v_order_id, v_user_id, v_total, 'preparing', v_order_time);

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    product_image,
    price_cents,
    quantity,
    delivery_option_id,
    estimated_delivery_at
  )
  select
    v_order_id,
    products.id,
    products.name,
    products.image,
    products.price_cents,
    cart_items.quantity,
    cart_items.delivery_option_id,
    current_date + case cart_items.delivery_option_id
      when '1' then 7
      when '2' then 3
      when '3' then 1
    end
  from public.cart_items
  join public.products on products.id = cart_items.product_id
  where cart_items.user_id = v_user_id;

  delete from public.cart_items where user_id = v_user_id;

  select jsonb_build_object(
    'id', orders.id,
    'orderTime', orders.created_at,
    'totalCostCents', orders.total_cents,
    'status', orders.status,
    'products', jsonb_agg(jsonb_build_object(
      'productId', order_items.product_id,
      'quantity', order_items.quantity,
      'deliveryOptionId', order_items.delivery_option_id,
      'estimatedDeliveryTime', order_items.estimated_delivery_at,
      'name', order_items.product_name,
      'image', order_items.product_image,
      'priceCents', order_items.price_cents
    ) order by order_items.id)
  )
  into v_order
  from public.orders
  join public.order_items on order_items.order_id = orders.id
  where orders.id = v_order_id
  group by orders.id;

  return v_order;
end;
$$;

revoke all on function public.place_order_from_cart() from public, anon;
grant execute on function public.place_order_from_cart() to authenticated;