-- Ejecutar conectado como el usuario de la aplicación (Oracle 12c o superior).
CREATE TABLE estudiante (
    id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  VARCHAR2(100) NOT NULL,
    correo  VARCHAR2(120) NOT NULL UNIQUE
);

INSERT INTO estudiante (nombre, correo) VALUES ('Ana Torres', 'ana.t@unicesar.edu.co');
INSERT INTO estudiante (nombre, correo) VALUES ('Luis Pérez', 'luis.p@unicesar.edu.co');
COMMIT;
