-- PersisteApp · base de demo del CRUD Java (REQ-18 CA5). Motor: Oracle 18c o superior.
-- Mismas tablas y columnas que postgresql/001_schema.sql: el código Java no cambia.

CREATE TABLE products (
    id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name   VARCHAR2(80)  NOT NULL UNIQUE,
    price  NUMBER(10, 2) NOT NULL CHECK (price >= 0),
    stock  NUMBER(10)    NOT NULL CHECK (stock >= 0)
);

CREATE TABLE sales (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id  NUMBER        NOT NULL REFERENCES products(id),
    quantity    NUMBER(10)    NOT NULL CHECK (quantity > 0),
    total       NUMBER(12, 2) NOT NULL CHECK (total >= 0),
    sold_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE users (
    id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name      VARCHAR2(50)  NOT NULL UNIQUE,
    password  VARCHAR2(100) NOT NULL
);
