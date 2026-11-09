# PersisteApp · Nuevo rumbo: teoría de bases de datos → Java sin ORM

> Rama: `feat/teoria-bd`. Decidido el 8 nov 2026 tras hablar con el docente. Clase: 9 nov 2026.
> Este documento **reemplaza** el temario de la sesión 1 de `01-requirements.md` (REQ-06, REQ-10 a REQ-16, REQ-29 a REQ-31). Las reglas de plataforma (REQ-01 a REQ-05, REQ-07, REQ-09, REQ-32) siguen vigentes.

## 1. Qué pidió el docente

- La plataforma **no se califica**: la nota es el proyecto de aula. La plataforma es **apoyo de clase** para que entiendan.
- Menos tecnicismo de Java. Primero **qué es una base de datos y SQL**, con práctica.
- Después, **cómo se lleva una tabla a Java sin ORM**: IDs → llaves primarias, llaves foráneas, filas → objetos.
- Se mantiene **el viaje**: Java → driver → red → motor y de vuelta.
- Diferencias breves entre PostgreSQL y otros motores (sintaxis).
- Elementos interactivos: tarjetas que simulen una tabla, una clase y la conexión entre ellas.

## 2. Requisitos (EARS)

### REQ-40 · Temario de 6 módulos — **M**
- **CA1.** La sesión 1 debe tener 6 módulos: 3 de teoría de BD (1–3) y 3 de Java (4–6).
- **CA2.** La suma de los 6 módulos no debe pasar de **90 min** (falla el build).
- **CA3.** Cada módulo debe tener al menos un elemento interactivo y empezar por teoría.

### REQ-41 · Anatomía de una tabla — **M** (módulo 1)
- **CA1.** El sistema debe mostrar una tabla como tarjeta con columnas, filas y celdas.
- **CA2.** Cuando el estudiante toca una columna, una fila, una celda o la llave primaria, el sistema debe explicar qué es esa parte.

### REQ-42 · Laboratorio SQL real — **M** (módulos 2 y 3)
- **CA1.** El sistema debe ejecutar SQL de PostgreSQL de verdad en el navegador (PGlite) sobre las tablas `curso`, `estudiante` y `matricula`.
- **CA2.** El estudiante puede pulsar consultas preparadas (SELECT, INSERT, UPDATE, DELETE, JOIN) o escribir la suya.
- **CA3.** Tras cada consulta el sistema debe mostrar las filas resultantes o las filas afectadas, y el estado actualizado de la tabla.
- **CA4.** La salida debe rotularse `Ejecución real`. Un botón «Reiniciar datos» vuelve al estado inicial.
- **CA5.** Si el motor no carga, el sistema debe decirlo y mostrar el resultado esperado de las consultas preparadas, rotulado `Simulación`.
- **CA6.** Un error de SQL se muestra con el mensaje del motor, sin romper la página.

### REQ-43 · Relaciones y llaves — **M** (módulo 3)
- **CA1.** El sistema debe mostrar dos tablas unidas por una llave foránea.
- **CA2.** Cuando el estudiante toca una fila hija, el sistema debe resaltar la fila padre a la que apunta, y al revés.
- **CA3.** El laboratorio debe mostrar qué pasa al violar una FK (error real del motor) y una transacción con `BEGIN` / `ROLLBACK`.

### REQ-44 · El viaje — **M** (módulo 4)
- **CA1.** Se reutiliza el mapa del sistema (Java → driver → red → motor) con su animación de ida y vuelta.

### REQ-45 · De la tabla a la clase — **M** (módulo 5)
- **CA1.** El sistema debe mostrar una tarjeta de tabla y una tarjeta de clase Java lado a lado.
- **CA2.** Cuando el estudiante toca una columna, el sistema debe resaltar el atributo correspondiente (y al revés) y explicar el tipo (`INTEGER` → `int`, `VARCHAR` → `String`, `DATE` → `LocalDate`…).
- **CA3.** La PK se muestra como el atributo `id`; la FK como un atributo `cursoId`, con la explicación de que sin ORM **tú** decides cómo representarla.
- **CA4.** El estudiante puede convertir una fila en objeto y un objeto en fila (animación).

### REQ-46 · Sin ORM: tú escribes el puente — **M** (módulo 6)
- **CA1.** Cada verbo SQL debe mostrarse junto al método Java que lo envía (`PreparedStatement`).
- **CA2.** Una simulación paso a paso debe mostrar cómo un `ResultSet` se convierte en objetos con `rs.getInt("id")`, `rs.getString("nombre")`.

### REQ-47 · Sin quiz — **M**
- **CA1.** El quiz final y las salas se ocultan de la landing, del encabezado y del menú. El código queda en el repositorio.
- **CA2.** El último módulo termina en «Volver al inicio».
- **CA3.** Se mantiene la invitación a dar estrella al repositorio.

## 3. Diseño

### Temario

| # | Etapa | Título | Interactivo | Min |
|---|---|---|---|---|
| 1 | BD | Dónde viven los datos cuando apagas el programa | `table-anatomy` | 12 |
| 2 | BD | Cuatro verbos para hablarle a una tabla | `sql-lab` | 18 |
| 3 | BD | Tablas que se señalan: llaves y relaciones | `relations` + `sql-lab` (FK, JOIN, transacción) | 15 |
| 4 | Java | El viaje de una consulta | `system-map` (existente) | 10 |
| 5 | Java | De la tabla a la clase | `table-class` | 15 |
| 6 | Java | Sin ORM: tú escribes el puente | `row-mapper` | 15 |

Total: 85 min.

### Datos de ejemplo (iguales en todos los visuales)

```sql
CREATE TABLE curso (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(80) NOT NULL,
  creditos INTEGER NOT NULL
);
CREATE TABLE estudiante (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(80) NOT NULL,
  correo    VARCHAR(120) UNIQUE,
  nacimiento DATE
);
CREATE TABLE matricula (
  id            SERIAL PRIMARY KEY,
  estudiante_id INTEGER NOT NULL REFERENCES estudiante(id),
  curso_id      INTEGER NOT NULL REFERENCES curso(id),
  nota          NUMERIC(2,1)
);
```

### Piezas nuevas

- `lib/sample-db.ts`: esquema, datos iniciales y consultas preparadas (una sola fuente).
- `components/db/sql-lab.tsx`: carga `@electric-sql/pglite` con `import()` dinámico solo en el navegador; una instancia por laboratorio.
- `components/db/table-card.tsx`: tarjeta de tabla reutilizable (encabezado, columnas con PK/FK, filas, resaltado).
- `components/db/table-anatomy.tsx`, `relations-map.tsx`, `table-class.tsx`, `row-mapper.tsx`.
- `lesson-schema.ts`: nuevos `simulators`: `table-anatomy`, `sql-lab`, `relations`, `table-class`, `row-mapper`. `sql-lab` acepta `props.queries` (ids de consultas preparadas) y `props.table` (tabla visible).
- Contenido viejo (m1–m8) sale de `content/s1`; sigue en `main` y en el historial.

## 4. Trabajo en paralelo: dos agentes

Ambos trabajan en la rama `feat/teoria-bd`, en la misma carpeta. **Nunca tocan los archivos del otro.** Cada uno hace `git add <sus rutas>` y commits atómicos (Conventional Commits, sin líneas de atribución). Nadie hace push ni merge a `main`.

### Contrato fijo (ya está en el código, no cambiarlo)

- `simulators` en `web/lib/lesson-schema.ts` ya incluye: `table-anatomy`, `sql-lab`, `relations`, `table-class`, `row-mapper`. Mientras un visual no exista, el paso muestra «Simulador … en construcción» y el build pasa.
- Props de `sql-lab`: `{ "queries": ["select-all", "update", …], "table": "estudiante" }`. Ids válidos: `presetQueries` en `web/lib/sample-db.ts`.
- Props de `table-class`: `{ "table": "estudiante" | "curso" | "matricula" }`. Los demás visuales no llevan props.
- Datos de ejemplo: `web/lib/sample-db.ts` (curso, estudiante, matricula). Todo texto de lección usa esos nombres.
- Archivos de lección (módulo, id = nombre de archivo):

| # | Archivo | Dueño |
|---|---|---|
| 1 | `content/s1/s1-m1-que-es-una-base-de-datos.json` | Claude Code |
| 2 | `content/s1/s1-m2-sql-cuatro-verbos.json` | Claude Code |
| 3 | `content/s1/s1-m3-llaves-y-relaciones.json` | Claude Code |
| 4 | `content/s1/s1-m4-el-viaje.json` | Codex |
| 5 | `content/s1/s1-m5-de-tabla-a-clase.json` | Codex |
| 6 | `content/s1/s1-m6-sin-orm.json` | Codex |

- En el texto de las lecciones funcionan `código`, **negrita** y *cursiva*.
- Las lecciones viejas ya se quitaron de `content/s1`. Para reutilizar texto: `git show main:web/content/s1/s1-m1-mapa-del-sistema.json`.

### Agente A · Claude Code (visuales y teoría de BD)

Archivos: `web/components/db/**`, `web/lib/sample-db.ts`, `web/components/lesson/steps.tsx` (solo `VisualStep`), `package.json` (PGlite), lecciones 1–3.

| Id | Tarea |
|---|---|
| A1 | `table-card` + `table-anatomy` (hecho) |
| A2 | `sql-lab` con PGlite, una instancia por paso, «Reiniciar datos», errores reales, respaldo simulado |
| A3 | `relations`: matricula ↔ estudiante/curso, tocar una fila resalta la otra |
| A4 | `table-class`: tarjeta tabla ↔ tarjeta clase Java, tipos, PK → `id`, FK → `cursoId`, fila ↔ objeto |
| A5 | `row-mapper`: `ResultSet` paso a paso → `new Estudiante(…)` |
| A6 | Lecciones 1–3 |
| A7 | Revisión visual a 375 px y en modo exposición |

### Agente B · Codex (plataforma, quiz oculto, lecciones Java)

Archivos: `web/lib/course.ts`, `web/lib/content.ts`, `web/app/page.tsx`, `web/components/site-header.tsx`, `web/components/modules-menu.tsx`, `web/app/s1/quiz/**`, `web/tests/**`, `web/content/s1/quiz.json`, `web/content/s1/snippets.json`, lecciones 4–6.

| Id | Tarea |
|---|---|
| B1 | `course.ts`: `sessionOneOutline` con los 6 módulos de §3 (títulos y minutos), sin módulo opcional; `MODULES_BUDGET_MINUTES = 90`; quitar `finalQuiz` de los totales |
| B2 | `content.ts`: `nextAfter` del último módulo → `{ href: "/", label: "Volver al inicio" }`; `loadQuiz` sin chequeo de cobertura por módulo |
| B3 | Ocultar quiz y salas (REQ-47): quitar «Ir al quiz» del encabezado y del menú; `/s1/quiz` redirige a `/` (dejar el código de quiz en `lib/` y `components/quiz/`). `/docente` y `/sala` no se enlazan desde ningún lado |
| B4 | Landing `app/page.tsx`: nuevo mensaje («Qué es una base de datos y cómo la usa Java, sin ORM»), sin secciones de quiz, ranking ni salas; recorrido con los 6 módulos; **mantener** el bloque de estrella del repositorio. Puede mostrar `TableAnatomy` (`@/components/db/table-anatomy`) como demo en vez del pool |
| B5 | Lección 4 «El viaje de una consulta» (10 min): reutilizar del viejo m1 el `system-map` y el paso `trace`, menos tecnicismo; 1 pregunta |
| B6 | Lección 5 «De la tabla a la clase» (15 min): teoría (tabla = clase, fila = objeto, columna = atributo, PK = `id`, FK = `cursoId` decidido por ti sin ORM, tabla de tipos SQL → Java), visual `table-class` con `{ "table": "estudiante" }` y luego `{ "table": "matricula" }`, 1 `pick-line` sobre la clase `Estudiante`, 1 pregunta |
| B7 | Lección 6 «Sin ORM: tú escribes el puente» (15 min): cada verbo SQL junto a su `PreparedStatement` (código `java` corto, `?` como parámetros), visual `row-mapper`, 1 `fill` con selector (`getInt`/`getString`), `getGeneratedKeys` para el id de SERIAL en una frase, 1 pregunta |
| B8 | Pruebas: arreglar `tests/content.test.ts`, `course.test.ts`, `quiz.test.ts` al nuevo temario; `npm test` y `npm run build` en verde |

Reglas de contenido para ambos: frases cortas, una idea por paso, cada lección `theory` y luego `practice`, preguntas según REQ-32 (largo equilibrado), ejercicios cortos (elegir línea o completar con selector; **no** ordenar bloques), español neutro, nada de pool, capas ni Spring.

### Integración (Claude Code, al final)

`npm test`, `npm run build`, recorrido de los 6 módulos en el navegador, deploy preview de la rama.

## 5. Tareas

| Id | Tarea | Estado |
|---|---|---|
| T-40 | Rama y este documento | hecho |
| T-41 | `sample-db` + `table-card` + `table-anatomy` | |
| T-42 | `sql-lab` con PGlite y respaldo simulado | |
| T-43 | `relations` (FK resaltada) | |
| T-44 | `table-class` y `row-mapper` | |
| T-45 | Contenido módulos 1–6 | |
| T-46 | Ocultar quiz y salas; landing con el nuevo temario; presupuesto 90 min | |
| T-47 | Pruebas, build, revisión a 375 px y en proyector, deploy preview | |

## 6. Avisos de Claude Code para Codex (8 nov, noche)

- **`web/app/page.tsx`**: Claude Code insertó la sección `#basico` («Antes de los módulos, lo básico», componente `DbBasics`) antes de `#conceptos`, y el botón del hero ahora apunta a `#basico`. **Consérvala** al seguir editando la landing; no reescribas el archivo entero.
- Nuevo simulador disponible: `crud-demo` (los 4 verbos animados, sin props).

## 7. Ronda 2 (8 nov, noche): todo explicable como una presentación

Pedido del autor tras revisar: muy sencillo de explicar, cada pantalla con algo que se toca, nada sin contexto.

### Reglas de contenido (para los dos agentes)

1. **Nunca código suelto.** Todo código va en el visual `code-explain`: cada línea tiene su explicación en palabras simples. Si un paso `code` de lectura queda, su paso siguiente lo explica con `code-explain` o se reemplaza.
2. **Nunca un término sin explicar.** La primera vez que aparece `executeQuery()`, `ResultSet`, `PreparedStatement`, `driver`, `FK`… se dice qué es en una frase de la vida real («`executeQuery()` = "envía este SELECT y tráeme las filas"»).
3. **Nunca solo texto.** Un paso `text` lleva `image` o va seguido de un visual que lo muestre. Máximo 2 párrafos cortos (≈ 45 palabras en total).
4. **Siempre contexto concreto.** Todo ejemplo usa estudiante, curso y matrícula de la Unicesar. Nada de frases abstractas («¿por qué no una sola tabla gigante?» sin mostrar la tabla).
5. **Solo PostgreSQL y Oracle.** Sin MySQL ni otros motores.
6. **Un módulo = una presentación de 6–8 pasos**: teoría con visual → práctica corta (1–2 preguntas o un ejercicio con selector).

### Visual nuevo para ambos: `code-explain`

```json
{ "kind": "visual", "stage": "theory", "component": "code-explain",
  "title": "…", "caption": "Toca cada línea.",
  "props": { "language": "java", "lines": [
    { "code": "ResultSet rs = ps.executeQuery();", "say": "Envía el SELECT al motor y guarda las filas que vuelven en rs, una tabla que se lee de arriba abajo." }
  ] } }
```

- `language`: `"java"` o `"sql"`. `lines`: 2–10 líneas; `say` ≤ 25 palabras, sin jerga nueva.
- Una línea vacía o `}` puede llevar `"say": ""` (no se puede tocar).

### División

| Agente | Qué |
|---|---|
| **Claude Code** | `code-explain`, visual `split-tables` (tabla gigante frente a tablas separadas), tarjetas de la landing (sin MySQL, mejor cuadradas), reescribir módulos 1–3 |
| **Codex** | Reescribir módulos 4–6 con las reglas: todo código a `code-explain`, explicar cada término Java la primera vez, quitar pasos de solo texto; revisar `system-map` (textos de las 4 piezas en lenguaje simple, sin nombres de clases del CRUD viejo como `ProductRepository`) y `TableAnatomy`/`SystemMap` en la landing si algo queda técnico |

Codex: espera a que exista `web/components/db/code-explain.tsx` (Claude Code lo commitea primero, `feat(db): code-explain`); mientras tanto puedes escribir el JSON, el build lo valida igual.
