# CRUD Java de referencia (REQ-17, REQ-18, REQ-19)

Dos versiones de la misma tienda de consola (productos, ventas y login) contra la misma base:

| Carpeta | Qué es | Para qué módulo |
|---|---|---|
| `v0-messy/` | Una sola clase `App.java`, **mal a propósito**: conexión nueva por opción, SQL concatenado, venta sin transacción | Demo de los defectos (módulos 3, 4, 5 y 6) |
| `v1-layered/` | Paquetes `model`, `persistence`, `service`, `ui`; pool HikariCP; `PreparedStatement`; `registerSale` con commit y rollback | La versión correcta |
| `db/postgresql/`, `db/oracle/` | `001_schema.sql` (tablas `products`, `sales`, `users`) y `002_seed.sql` | Los dos motores |

Requisitos: Java 17 o superior y Maven 3.9.

## 1. Crear la base en Supabase

1. SQL editor de Supabase → pegar y ejecutar `db/postgresql/001_schema.sql` (se puede repetir sin perder datos).
2. Ejecutar `db/postgresql/002_seed.sql` (vacía las tablas y carga los datos de demo; úsalo también para reiniciar antes de clase).

La tabla `users` guarda claves en texto plano **solo para la demo de inyección**: no usar claves reales. RLS queda activado sin políticas, así la API pública de Supabase no ve estas tablas.

## 2. Variables de entorno

Supabase → **Connect** → *Session pooler* (puerto 5432; el *transaction pooler* del 6543 no se lleva bien con los `PreparedStatement`).

```powershell
$env:DB_URL = "jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
$env:DB_USER = "postgres.<project-ref>"
$env:DB_PASSWORD = "<clave de la base>"
```

Nunca escribir la clave en el código ni subirla al repositorio.

## 3. Ejecutar

```powershell
cd crud/v1-layered
mvn -q compile exec:java
```

```powershell
cd crud/v0-messy
mvn -q compile exec:java
```

Si las tildes salen mal en la consola de Windows, ejecutar antes `chcp 65001`.

## 4. Guion de demo

En **v0**:
- Opción 2, nombre `x' OR '1'='1` → devuelve todos los productos (inyección).
- Opción 5, usuario `' OR '1'='1' --` y cualquier clave → «Bienvenido» (el login del módulo 4).
- Opción 4, producto `3`, cantidad `9` → «la venta ya quedó guardada» aunque no había stock: la tabla `sales` queda con una venta que nunca descontó stock.

En **v1**, lo mismo:
- Opción 7 con el mismo usuario → «Usuario o clave incorrectos».
- Opción 6, producto `3`, cantidad `9` → «Stock insuficiente»: la venta se insertó y el rollback la borró. En `sales` no aparece (el id de la secuencia sí se gastó: prueba de que el `INSERT` ocurrió).
- Opción 6, producto `3`, cantidad `2` → «Venta … registrada (commit)» y el stock baja de 5 a 3.

## 5. Pruebas

```powershell
cd crud/v1-layered
mvn verify
```

JUnit 5 + Mockito sobre `ProductService`, `LoginService` y `JdbcTransactionRunner`. JaCoCo falla el build si `service` baja de 70 % de líneas cubiertas (hoy 100 %). Informe en `target/site/jacoco/index.html`.

## 6. Cambiar a Oracle (REQ-18 CA5)

1. Ejecutar `db/oracle/001_schema.sql` y `002_seed.sql` en Oracle 18c o superior.
2. Cambiar solo la URL y el driver:

```powershell
$env:DB_URL = "jdbc:oracle:thin:@localhost:1521/XEPDB1"
mvn -q -P oracle compile exec:java
```

El código Java no cambia: el SQL es estándar y la clave generada se pide por nombre de columna (`new String[] {"id"}`), que funciona en los dos motores.
