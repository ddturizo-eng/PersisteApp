-- PersisteApp · base de demo para el CRUD Java (REQ-19).
-- Tablas products y sales con FK. Ejecutar una vez en el SQL editor de Supabase (PostgreSQL).
-- Es idempotente: se puede volver a ejecutar sin duplicar datos.
--
-- El CRUD Java se conecta por JDBC con la cadena del Session pooler y el usuario postgres,
-- que es dueño de las tablas y no pasa por RLS. RLS queda activado y sin políticas para que
-- la Data API (clave pública) no pueda leer ni modificar estas tablas.

create table if not exists products (
  id          integer generated always as identity primary key,
  name        varchar(100)  not null unique,
  price       numeric(10, 2) not null check (price >= 0),
  stock       integer        not null default 0 check (stock >= 0),
  created_at  timestamptz    not null default now()
);

create table if not exists sales (
  id          integer generated always as identity primary key,
  product_id  integer        not null references products(id),
  quantity    integer        not null check (quantity > 0),
  unit_price  numeric(10, 2) not null check (unit_price >= 0),  -- precio al momento de vender
  sold_at     timestamptz    not null default now()
);

create index if not exists sales_product_idx on sales (product_id);

alter table products enable row level security;
alter table sales    enable row level security;

revoke all on products, sales from anon, authenticated;

-- Datos de ejemplo para la demo en clase.
insert into products (name, price, stock) values
  ('Teclado mecánico', 189000.00, 12),
  ('Mouse inalámbrico',  65000.00, 30),
  ('Monitor 24"',       720000.00,  5),
  ('Audífonos USB',      98000.00,  0)
on conflict (name) do nothing;
