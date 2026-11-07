-- Datos de demo (Oracle). Para reiniciar: borrar las tablas y volver a ejecutar 001 y 002.
INSERT INTO products (name, price, stock) VALUES ('Teclado mecánico', 185000.00, 12);
INSERT INTO products (name, price, stock) VALUES ('Mouse inalámbrico',  65000.00, 30);
INSERT INTO products (name, price, stock) VALUES ('Monitor 24"',       720000.00,  5);
INSERT INTO products (name, price, stock) VALUES ('Memoria USB 64 GB',  38000.00,  2);
INSERT INTO products (name, price, stock) VALUES ('Audífonos',          99000.00,  0);

INSERT INTO users (name, password) VALUES ('ana', 'clave123');
INSERT INTO users (name, password) VALUES ('docente', 'persiste2026');

COMMIT;
