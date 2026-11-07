-- PersisteApp · base de demo del CRUD Java (REQ-19). Motor: PostgreSQL (Supabase).
-- Ejecutar una vez en el SQL editor de Supabase. Es idempotente.
--
-- Seguridad: el CRUD se conecta por JDBC con el usuario de la base, que no pasa por RLS.
-- RLS queda activado y SIN políticas, y se revocan los permisos de anon y authenticated,
-- así la API pública de Supabase no puede leer estas tablas (users guarda claves en texto
-- plano a propósito, para la demo de inyección del módulo 4: no usar claves reales).

create table if not exists products (
    id     integer generated always as identity primary key,
    name   varchar(80)   not null unique,
    price  numeric(10, 2) not null check (price >= 0),
    stock  integer        not null check (stock >= 0)
);

create table if not exists sales (
    id          integer generated always as identity primary key,
    product_id  integer        not null references products(id),
    quantity    integer        not null check (quantity > 0),
    total       numeric(12, 2) not null check (total >= 0),
    sold_at     timestamp      not null default current_timestamp
);

create table if not exists users (
    id        integer generated always as identity primary key,
    name      varchar(50)  not null unique,
    password  varchar(100) not null
);

alter table products enable row level security;
alter table sales    enable row level security;
alter table users    enable row level security;

revoke all on products, sales, users from anon, authenticated;
