-- Ejecutar UNA vez como SYSTEM (o SYS) dentro de la PDB, por ejemplo XEPDB1.
-- Crea un usuario solo para la app, con los permisos mínimos.
-- Cambia la clave por una tuya y guárdala en la variable DB_PASSWORD, no en el código.
CREATE USER persiste_app IDENTIFIED BY "CambiaEstaClave_2026";
GRANT CREATE SESSION, CREATE TABLE TO persiste_app;
ALTER USER persiste_app QUOTA 50M ON USERS;
