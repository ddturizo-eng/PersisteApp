-- Datos de demo. Se puede volver a ejecutar: vacía las tablas y reinicia los id.
truncate table sales, products, users restart identity;

insert into products (name, price, stock) values
    ('Teclado mecánico', 185000.00, 12),
    ('Mouse inalámbrico',  65000.00, 30),
    ('Monitor 24"',       720000.00,  5),
    ('Memoria USB 64 GB',  38000.00,  2),
    ('Audífonos',          99000.00,  0);

insert into users (name, password) values
    ('ana',    'clave123'),
    ('docente', 'persiste2026');
