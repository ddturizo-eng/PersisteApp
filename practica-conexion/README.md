# Práctica de conexión: Java + Oracle sin ORM

Versión resumida de la estructura por capas de
[GameZoneUnicesar](https://github.com/adbautistar/GameZoneUnicesar): un CRUD de
estudiantes en consola, conectado a Oracle con JDBC puro.

```
src/main/java/com/persiste/
├── Main.java                       arma las capas y arranca el menú
├── config/
│   ├── DatabaseConfig.java         lee DB_URL, DB_USER y DB_PASSWORD del entorno
│   └── ConnectionFactory.java      abre conexiones a Oracle (OracleDataSource)
├── model/
│   └── Estudiante.java             una fila de la tabla como objeto
├── persistence/
│   ├── EstudianteStore.java        interfaz: qué necesita el servicio
│   └── EstudianteRepository.java   JDBC + PreparedStatement sobre Oracle
├── service/
│   └── EstudianteService.java      validaciones, sin SQL
└── ui/
    └── EstudianteMenu.java         menú de consola
```

Cada capa solo conoce a la de abajo: `ui → service → persistence → config`.

## 1. Preparar Oracle

Conéctate como `SYSTEM` a la PDB (en Oracle XE suele ser `XEPDB1`):

```bash
sqlplus system@//localhost:1521/XEPDB1
```

1. Edita la clave en `sql/usuario.sql` y ejecútalo: crea `persiste_app`, un usuario con permisos mínimos.
2. Conéctate como ese usuario y ejecuta `sql/schema.sql`:

```bash
sqlplus persiste_app@//localhost:1521/XEPDB1 @sql/schema.sql
```

> Si tu servicio no es `XEPDB1`, búscalo con `SELECT name FROM v$pdbs;` como SYSTEM.

## 2. Definir las variables de entorno

La clave **nunca** va en el código. `.env.example` lista las variables; los
valores reales viven solo en tu equipo.

**PowerShell, solo para la terminal actual:**

```powershell
$env:DB_URL = "jdbc:oracle:thin:@//localhost:1521/XEPDB1"
$env:DB_USER = "persiste_app"
$env:DB_PASSWORD = "tu-clave"
```

**Permanentes para tu usuario de Windows** (abre una terminal nueva después):

```powershell
setx DB_URL "jdbc:oracle:thin:@//localhost:1521/XEPDB1"
setx DB_USER "persiste_app"
setx DB_PASSWORD "tu-clave"
```

En IntelliJ o NetBeans también puedes ponerlas en la configuración de ejecución
(Run Configuration → Environment variables), que no se sube a Git.

Si falta alguna, el programa se detiene con:
`Error de configuración: Falta la variable de entorno DB_PASSWORD`.

## 3. Ejecutar

```bash
mvn compile exec:java
```

## Buenas prácticas que aplica

- **Variables de entorno** para URL, usuario y clave; `.env` está en `.gitignore`.
- **Usuario con permisos mínimos** (`persiste_app`), no `SYSTEM`.
- **`PreparedStatement` con `?`** en todas las consultas: sin inyección SQL.
- **try-with-resources**: la conexión siempre se cierra.
- **`executeQuery` para leer, `executeUpdate` para cambiar.**
- **El servicio depende de una interfaz** (`EstudianteStore`), no de Oracle.
- `DatabaseConfig.toString()` oculta la clave para que no salga en logs.
