# PersisteApp · Diseño técnico (CÓMO)

> Responde a `01-requirements.md`. Cada sección indica los `REQ` que cubre.

## 1. Vista general

```
┌──────────────────────────── Vercel ────────────────────────────┐
│  Next.js (App Router, TS, Tailwind)                            │
│   ├─ /                    portada + cursos           REQ-06    │
│   ├─ /s1/[lessonId]       LessonPlayer               REQ-01..05│
│   ├─ /lab/sql             laboratorio PGlite (lazy)  REQ-15    │
│   ├─ /referencia          chuleta + glosario         REQ-08    │
│   └─ /api/demo/products   lectura server-only de Supabase      │
│                           (demo docente, opcional)   REQ-19    │
└────────────────────────────────────────────────────────────────┘
          │ server env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY)
          ▼
   Supabase PostgreSQL  ◄───── CRUD Java v1 (equipo del docente, HikariCP)
```

- Sin backend propio salvo una ruta de solo lectura para la demo. Todo lo interactivo corre en el cliente.
- El Java nunca corre en Vercel (P2). La plataforma explica y simula; el docente ejecuta el CRUD real.

## 2. Estructura del repositorio

```
PersisteApp/
├─ specs/                      ← SDD (este documento y hermanos)
├─ roadmap/                    ← roadmap Jira + CSV de importación
├─ docs/ui-research.md         ← salida de la skill ui-reference-intelligence
├─ web/                        ← app Next.js
│  ├─ app/
│  │  ├─ layout.tsx            tema, fuente, script de tema y exposición, atajo P, CommandPalette
│  │  ├─ page.tsx              portada + índice del curso
│  │  ├─ s1/[lessonId]/page.tsx
│  │  ├─ lab/sql/page.tsx
│  │  └─ referencia/page.tsx
│  ├─ components/
│  │  ├─ lesson/               LessonPlayer, StepText, StepVisual, StepQuestion, StepCode, ProgressBar
│  │  ├─ code/                 CodeTabs (Oracle|PostgreSQL), PickLine, OrderBlocks, FillGaps
│  │  ├─ sims/                 PoolSimulator, InjectionLab, AppDbMirror, SystemMap, RequestTracer
│  │  ├─ ui/                   ExecutionBadge, Button, Kbd, GlossaryTerm, CommandPalette
│  │  └─ bits/                 componentes copiados de React Bits
│  ├─ content/s1/*.json        lecciones (REQ-01, REQ-16)
│  ├─ content/reference/*.json
│  ├─ lib/
│  │  ├─ lesson-schema.ts      zod + tipos
│  │  ├─ content.ts            carga y valida en build
│  │  ├─ progress.ts           localStorage
│  │  ├─ pglite.ts             import dinámico + seed products
│  │  └─ sims/pool-model.ts    modelo puro del pool (testeable)
│  └─ tests/                   Vitest para lib/ y sims puros
└─ crud/                       ← proyecto Java Maven
   ├─ v0-messy/
   ├─ v1-layered/
   └─ db/001_schema.sql, 002_seed.sql
```

## 3. Modelo de contenido (REQ-01..04, REQ-16)

```ts
type Engine = 'oracle' | 'postgresql';
type ExecutionKind = 'real' | 'simulated';

type Lesson = {
  id: string;                 // "s1-m4-consultas-seguras"
  session: 1 | 2;
  module: number;             // 1..8
  title: string;              // con gancho: "Por qué tu login deja entrar a cualquiera"
  estimatedMinutes: number;
  optional?: boolean;         // módulo 8
  source: { label: string; url: string };   // doc oficial JDBC / HikariCP / motor
  steps: Step[];
};

type Step =
  | { kind: 'text'; stage: Stage; body: string; glossary?: string[] }
  | { kind: 'visual'; stage: Stage; component: SimId; props?: Record<string, unknown>; caption: string }
  | { kind: 'question'; stage: Stage; prompt: string;
      options: { text: string; correct: boolean; explanation: string }[] }
  | { kind: 'code'; stage: Stage; mode: 'read' | 'pick-line' | 'order' | 'fill';
      variants: Partial<Record<Engine, string>> | { java: string };
      exercise?: PickLine | OrderBlocks | FillGaps; result: { kind: ExecutionKind; output: string } };

type Stage = 'problem' | 'visualize' | 'predict' | 'write' | 'run' | 'explain';
type SimId = 'pool' | 'injection' | 'mirror' | 'system-map' | 'request-tracer';
```

- **Fuente de verdad del esquema:** `web/lib/lesson-schema.ts` (zod 4). El bloque de arriba es orientativo; el código manda. Cambios respecto al bloque: ejercicios `fill` con huecos `{{n}}` y `gaps[]`, `pick-line` con `options[]`, `order` con `blocks[]` y `distractors[]`, y paso `text` con `reflection: true` para la bitácora de IA.
- Validación (REQ-01 CA2): `npm run build` ejecuta antes `prebuild` → `vitest run tests/content.test.ts`, que carga todo `content/` con `loadLessons()` y falla con `archivo → campo: mensaje`. El esquema también exige etapas en orden y las seis etapas en lecciones no opcionales.
- `stage` permite verificar que cada lección recorre las seis etapas (REQ-16 CA2) con una prueba.
- Un paso `explain` usa una plantilla fija con los cuatro campos de la bitácora del docente (REQ-16 CA3). No se envía a ningún lado; es reflexión guiada.

## 4. LessonPlayer (REQ-02, REQ-03, REQ-05, REQ-09)

- Estado local: `index`, `answered[]`. URL `?step=n` para poder retomar y para que el docente salte en vivo.
- Teclado: `→`/`Enter` avanzar, `←` retroceder, `P` modo exposición, `Ctrl K` buscador. Atajos ignorados si el foco está en un input.
- Modo exposición (`components/exposition.tsx`, sin contexto de React): atributo `data-exposition` en `<html>`, restaurado antes de pintar por un script en `<head>` y guardado en `localStorage`. Base tipográfica `clamp(22px, 3.2vh, 28px)`; se ocultan la cabecera del sitio, el título de la lección, la barra de progreso y la fuente. Teclas: `P` en cualquier página, `O` abre la vista general de pasos (`<dialog>` nativo, `Esc` cierra). El pie muestra el tiempo de exposición.
- Transición entre pasos: fundido de 150 ms; se anula con `prefers-reduced-motion`.
- **Ningún callejón sin salida (REQ-04 CA5):** cada ejercicio `order` y `fill` acepta `hints[]`; cada intento fallido muestra la siguiente pista y, desde el 2.º fallo, aparece «Ver solución». La solución mostrada desbloquea Continuar igual que resolverlo; el objetivo es que nadie abandone la clase en un paso.
- **Contenido para el público real:** ejercicios de ordenar con 4–6 bloques como máximo, sin anidar `try`, precedidos por un paso de texto que nombra las partes que se van a ordenar.

## 5. Simuladores (REQ-10..14)

Regla: **modelo puro en `lib/sims/`, vista en `components/sims/`**. El modelo se prueba con Vitest; la vista solo pinta.

| Simulador | Modelo | Vista |
|---|---|---|
| PoolSimulator | Cola discreta: `poolSize`, `requests=50`, `connectCostMs≈80`, `queryCostMs≈15`. Sin pool: cada petición paga `connectCost`. Con pool: solo las primeras `poolSize`. Devuelve timeline de eventos. | Slider, botón "Lanzar 50", rejilla de conexiones (libre/ocupada), cola, tiempo medio, comparación lado a lado. |
| InjectionLab | Función `buildQuery(user, pass, mode)` → `{ sql, params, authenticated }`. Usuarios ficticios en memoria. | Input usuario/clave, SQL resultante en vivo con el fragmento inyectado resaltado, interruptor Vulnerable/Seguro, código Java de cada versión. |
| AppDbMirror | Adaptador `MirrorDb` con dos implementaciones: `MemoryDb` (simulado) y `PgliteDb` (real). Operaciones `insert`, `begin`, `commit`, `rollback`, `select`. | Formulario a la izquierda, tabla a la derecha, log de sentencias, botón "Forzar fallo". Rótulo según implementación (REQ-12 CA4). |
| SystemMap | Estado de piezas colocadas. | Drag con `@dnd-kit` + alternativa de teclado (seleccionar pieza → seleccionar hueco). |
| RequestTracer | Lista fija de pasos. | Diagrama horizontal + panel de código resaltado. |

El adaptador `MirrorDb` permite empezar con `MemoryDb` el sábado y cambiar a PGlite sin tocar la vista (misma idea de inversión de dependencias que se enseña).

## 6. PGlite (REQ-15, REQ-12 CA4)

- `lib/pglite.ts`: `await import('@electric-sql/pglite')` solo en `/lab/sql` y en el espejo si el usuario pulsa "Usar PostgreSQL real".
- Persistencia en IndexedDB con nombre `persisteapp-products`. "Restaurar" = `DROP` + seed.
- Spike de 1 h el sábado antes de comprometerlo: verificar carga en Next (wasm en `next.config`), transacciones y `CREATE FUNCTION ... LANGUAGE plpgsql` (dato para sesión 2).
- Si el spike falla: REQ-15 se pospone y el espejo queda en `MemoryDb` rotulado `Simulación`.

## 7. CRUD Java (REQ-17..19)

```
crud/v1-layered/src/main/java/co/edu/unicesar/persisteapp/
├─ model/Product.java                 (id, title, price, stock)
├─ model/Sale.java
├─ persistence/ProductStore.java      save, update, delete, findById, findAll
├─ persistence/JdbcProductRepository.java
├─ persistence/ConnectionPool.java    HikariDataSource desde env (DB_URL, DB_USER, DB_PASSWORD)
├─ persistence/DataAccessException.java
├─ service/ProductService.java        reglas + registerSale (transacción)
├─ ui/ConsoleMenu.java                mensajes en español
└─ Main.java                          composición e inyección por constructor
```

- `registerSale` obtiene una conexión, `setAutoCommit(false)`, inserta en `sales`, actualiza `stock` con `WHERE stock >= ?`, verifica filas afectadas, `commit`; ante cualquier fallo `rollback` y lanza excepción propia.
  - Nota: la transacción vive en el servicio pero necesita la conexión; se resuelve con un método `ProductStore.registerSale(...)` o con un `TransactionRunner` en persistence. Decisión: **`TransactionRunner`** en `persistence`, para que el servicio no vea JDBC.
- Perfil Maven `oracle` cambia dependencia de driver; la URL viene del entorno (REQ-18 CA5).
- `v0-messy`: una clase `App.java` con `DriverManager.getConnection` en cada opción y `"SELECT ... WHERE title = '" + input + "'"`.
- `db/001_schema.sql` con variantes `postgresql/` y `oracle/`; se aplica en Supabase con el SQL editor.

## 8. Diseño visual (REQ-09, P8)

- Antes de maquetar, se ejecuta la skill `ui-reference-intelligence` sobre tres objetivos concretos: (1) reproductor de lección paso a paso, (2) modo exposición/presentación, (3) bloque de código con pestañas y ejercicios. Salida en `docs/ui-research.md`.
- Tokens en Tailwind 4 `@theme` dentro de `app/globals.css` (color, espacio, radio, tipografía mono para código). Tema claro/oscuro por `class`.
- Código resaltado con **Shiki** en servidor; ejercicios con inputs nativos. Monaco queda para fase 2 (decisión aprobada el 6 nov 2026).

### 8.1 React Bits: dónde y qué

Regla: animación solo en la portada (`/`), una vez por visita, y nunca dentro de una lección, del modo exposición ni de los simuladores. La landing interactiva (§12.4, REQ-33) amplía esta lista con `AnimatedContent`. Se instalan en variante TypeScript + Tailwind (`-TS-TW`) en `web/components/bits/`, y luego se adaptan a los tokens del proyecto.

| Componente | Categoría | Dónde | Para qué | Comportamiento |
|---|---|---|---|---|
| `SplitText` | Text Animations | `h1` "PersisteApp" de la portada | Entrada del título | Una sola vez al cargar; con `prefers-reduced-motion` se muestra estático. |
| `TextType` | Text Animations | Lema bajo el título | El lema «Lo que registras, queda guardado» se escribe como un registro | Escribe una vez y queda fijo (sin bucle ni borrado); el texto completo está en el DOM para lectores de pantalla. |
| `Threads` | Backgrounds | Fondo del bloque hero de la portada | Líneas que sugieren conexión app ↔ base de datos | Opacidad baja, detrás de un contraste AA verificado; se pausa fuera de pantalla y se desactiva con `prefers-reduced-motion` y en modo exposición. |

Instalación (comando del README de React Bits):

```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW @react-bits/TextType-TS-TW @react-bits/Threads-TS-TW
```

**Descartados y por qué**
- `Carousel` para las lecciones: oculta módulos detrás de flechas; el índice debe verse completo y en orden (REQ-06).
- `CountUp` para el progreso: animar "3 de 8" no aporta información (P8).
- `ClickSpark`, `SpotlightCard`, `ShinyText`, `Particles`, `Aurora`: decorativos, sin función didáctica.
- `DecryptedText` en el laboratorio de inyección: confundiría el SQL real que el estudiante debe leer.

**Instalado el 6 nov 2026** con `shadcn init` (librería base React Aria, preset Nova: Lucide + Geist). Dependencias verificadas en el código: `SplitText` usa `gsap` + `@gsap/react` (plugins `SplitText` y `ScrollTrigger`); `TextType` usa `gsap`; `Threads` usa WebGL2 directo, sin dependencias. Lint de `components/bits/**` relajado solo en `react-hooks/refs` y `react-hooks/set-state-in-effect` (código de terceros).

**Pendiente (PA-22):** medir el peso añadido a `/`. Si `Threads` añade más de ~50 KB gzip a la portada, se sustituye por un fondo CSS estático. Verificar que los tres respetan `prefers-reduced-motion`; si no, envolverlos.
- La carpeta `.impeccable/` ya existe en el proyecto; la skill `impeccable` se usa el domingo para la revisión de acabado.

## 9. Pruebas y verificación

| Capa | Herramienta | Qué cubre |
|---|---|---|
| Contenido | zod en build + Vitest | esquema, seis etapas por lección |
| Modelos de simuladores | Vitest | pool (tiempos con/sin pool), buildQuery (inyección), MemoryDb (rollback) |
| UI | revisión manual con checklist + navegador del IDE | teclado, 375 px, contraste, modo exposición |
| Java | JUnit 5 + Mockito + JaCoCo | `ProductService` ≥ 70 % |
| Integración Java | ejecución manual contra Supabase | CRUD y venta con rollback |

## 10. Riesgos y mitigación

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| El contenido de 8 módulos no cabe en el sábado | Alta | Alto | Plantilla de lección + la lección modelo del viernes; módulos 6 y 8 con versión mínima. |
| PGlite falla en Next/Vercel | Media | Medio | Adaptador `MirrorDb`; fallback `MemoryDb` rotulado. |
| Wi-Fi del aula caído el lunes | Media | Alto | Build estático; probar `next build` + servir local; PGlite cacheado. |
| Supabase pausa el proyecto gratuito | Baja | Medio | Abrirlo el domingo; tener PostgreSQL local con Docker como respaldo. |
| Scope creep (refactor guiado, detector de fugas) | Alta | Medio | Están en `W`; solo entran si el domingo a mediodía está todo `M` cerrado. |
| Ranking: red del aula saturada o caída | Media | Alto | El quiz sigue en modo práctica sin sala (REQ-29 CA4); las respuestas pendientes se reintentan al volver la red. |
| Ranking: nombres falsos o duplicados | Media | Bajo | Código estudiantil único por sala (REQ-28 CA3) y botón de eliminar en el panel docente. |
| Ranking: proyecto Supabase sin crear o claves sin cargar en Vercel | Media | Alto | T-36 crea el proyecto y carga las variables el sábado temprano; sin ellas la app sigue funcionando sin puntaje. |

## 11. Teoría → Práctica → Quiz, recorrido y ranking (cambio del 6 nov 2026)

Responde a REQ-26 a REQ-30 y a los principios P6 y P10.

### 11.1 Etapas y nuevos tipos de paso

- `stages` pasa de seis valores a tres: `theory`, `practice`, `quiz` (etiquetas Teoría, Práctica, Quiz). La regla del esquema se mantiene: las etapas avanzan en orden y una lección no opcional recorre las tres.
- Paso nuevo `trace` (REQ-27), etapa `practice`:

```ts
type TraceStep = {
  kind: "trace";
  stage: "practice";
  title: string;
  intro: string;
  locations: { id: string; label: string; kind: "file" | "class" | "db" }[]; // ".env", "ConnectionPool.java", "PostgreSQL"…
  events: {
    moment: string;          // "La app arranca"
    description: string;     // "Se leen DB_URL, DB_USER y DB_PASSWORD"
    options: string[];       // 3–4 ids de locations
    answer: string;          // id correcto
    why: Record<string, string>; // explicación por opción incorrecta
    explanation: string;     // al acertar
    code?: { language: "java" | "sql" | "properties"; source: string };
  }[];
};
```

- Paso nuevo `quiz` (REQ-29), etapa `quiz`: `{ kind: "quiz", stage: "quiz", questions: { id, prompt, options: { text, correct, explanation }[] }[] }`. El JSON guarda la respuesta correcta, pero el renderizado envía al navegador solo `id`, `prompt` y el texto de las opciones: `toPublicQuiz()` elimina `correct` y `explanation` antes de pasar las props al componente cliente.

### 11.2 Datos en Supabase

```sql
create table rooms (
  id          uuid primary key default gen_random_uuid(),
  code        char(6) not null unique,          -- A-Z sin I/O + 2-9
  label       text not null,                    -- "Grupo 8:00"
  session     smallint not null default 1,
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);
create table participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references rooms(id) on delete cascade,
  name          text not null check (length(name) between 2 and 60),
  student_code  text not null check (length(student_code) between 3 and 20),
  token         uuid not null default gen_random_uuid(), -- va en cookie httpOnly
  created_at    timestamptz not null default now(),
  unique (room_id, student_code)
);
create table quiz_answers (
  participant_id uuid not null references participants(id) on delete cascade,
  lesson_id      text not null,
  question_id    text not null,
  shown_at       timestamptz not null default now(),  -- lo fija el servidor al entregar la pregunta
  option_index   smallint,                            -- null hasta que responde
  correct        boolean,
  answered_at    timestamptz,
  primary key (participant_id, lesson_id, question_id)   -- el primer intento gana (REQ-29 CA3)
);
-- Tiempo por pregunta con tope de 60 s (REQ-30 CA1b).
create view answer_times as
  select *, least(extract(epoch from answered_at - shown_at), 60) as seconds
  from quiz_answers where answered_at is not null;
-- Aciertos y desempate por tiempo en correctas (REQ-30 CA1).
create view room_ranking as
  select p.room_id, p.id as participant_id, p.name, p.student_code,
         count(t.*) filter (where t.correct)                   as score,
         coalesce(sum(t.seconds) filter (where t.correct), 0)  as correct_seconds,
         count(t.*)                                            as answered
  from participants p left join answer_times t on t.participant_id = p.id
  group by p.id;
-- Orden: score desc, correct_seconds asc.
```

- `shown_at` se inserta con `on conflict do nothing` en `startQuestion`, así que recargar la página no reinicia el reloj.

- RLS activado en las tres tablas y **sin políticas** para `anon`: solo el servidor, con `SUPABASE_SERVICE_ROLE_KEY`, lee y escribe (P3, P10).
- Script versionado en `web/supabase/001_quiz.sql`.

### 11.3 Servidor (Next.js 16, Server Actions)

| Acción | Quién | Qué hace |
|---|---|---|
| `joinRoom(code, name, studentCode)` | Estudiante | Valida con zod, hace upsert por `(room_id, student_code)`, guarda `token` en cookie httpOnly `pa_participant` (SameSite=Lax, 12 h). |
| `startQuestion(lessonId, questionId)` | Estudiante | Inserta la fila con `shown_at = now()` si no existe (el reloj no se reinicia). Sin sala: no hace nada. |
| `submitAnswer(lessonId, questionId, optionIndex)` | Estudiante | Lee la cookie, busca la pregunta en `content/` (servidor), califica y actualiza la fila solo si `answered_at is null` (primer intento). Devuelve `{ correct, explanation, firstAttempt, seconds }`. Sin sala: califica igual y no guarda. |
| `getRoomReport(roomId)` | Docente | Una sola consulta por vista (En vivo, Por pregunta, Por estudiante) sobre `answer_times` y `room_ranking`; la agregación por opción se hace en el servidor. |
| `getMyStanding()` | Estudiante | Puntaje propio y posición en su sala. |
| `createRoom(label)`, `closeRoom(id)`, `removeParticipant(id)` | Docente | Exigen la cookie `pa_teacher`, emitida al validar `TEACHER_PASSCODE`. |
| `GET /docente/ranking.csv?room=` | Docente | Exporta el CSV de REQ-30 CA4. |

- Rutas: `/sala` (entrar con código), `/docente` (clave, salas, ranking con refresco cada 5 s), `/docente/proyectar/[room]` (top 10 para exposición, nombre + inicial).
- Cliente Supabase solo en `web/lib/supabase-server.ts` con `import "server-only"`.
- Variables nuevas en Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TEACHER_PASSCODE`.

### 11.4 Interfaz

- **Barra de sala** bajo la cabecera: «Sala Grupo 8:00 · Daniel T. · 7 aciertos · puesto 3». Sin sala: enlace «Entrar a una sala para sumar puntos».
- **Quiz:** una pregunta por pantalla, feedback inmediato del servidor, rótulo «Cuenta para el ranking» o «Sin puntaje». Al final, resumen del módulo y posición.
- **Recorrido:** a la izquierda la línea de tiempo con los eventos ya resueltos (evento → lugar); a la derecha el evento actual con sus opciones. En móvil, la línea de tiempo se pliega sobre el evento.
- **Ranking proyectado:** tabla grande, los 3 primeros con su puesto en texto («1.º»), sin medallas ni confeti (P8).

### 11.5 Panel docente (REQ-31)

```
/docente                      clave → cookie pa_teacher (12 h)
/docente                      lista de salas: código, estado, participantes, [+ Nueva sala]
/docente/sala/[id]            pestañas: En vivo · Por pregunta · Por estudiante · Proyectar
/docente/sala/[id]/csv        Route Handler que devuelve el CSV
```

| Pestaña | Contenido | Actualización |
|---|---|---|
| En vivo | Estudiante, módulo actual, aciertos, tiempo en correctas, puesto; top 3 destacado | Consulta cada 5 s mientras la pestaña está visible (`visibilitychange` la pausa) |
| Por pregunta | % de aciertos, barras por opción con conteo, tiempo promedio; aviso si < 50 %; al tocar una opción, lista de nombres | Al abrir y con botón «Actualizar» |
| Por estudiante | Respuestas una por una: opción, correcta o no, segundos | Al abrir |
| Proyectar | Top 10 con nombre e inicial, en modo exposición | Cada 5 s |

### 11.6 Sin servidor propio (P11)

- Todo corre en Vercel como funciones serverless y en Supabase gestionado; no hay VPS, procesos permanentes ni WebSockets propios.
- Carga estimada de una clase: ~35 estudiantes × ~35 preguntas × 2 llamadas (mostrar y responder) ≈ 2 500 invocaciones por grupo, más el panel cada 5 s durante 100 min ≈ 1 200. Muy por debajo de los límites del plan gratuito de Vercel y de Supabase.
- Las lecciones (con sus respuestas correctas) viajan dentro del despliegue de Vercel en `content/`; la Server Action las lee del disco, nunca desde el navegador.
- Supabase pausa los proyectos gratuitos tras 7 días sin uso: abrir el proyecto el domingo y antes de cada sesión (ver §10).

## 12. Quiz final de la sesión y landing de conceptos (cambio del 6 nov 2026, tarde)

Responde a REQ-26 (cambiado), REQ-29 (cambiado), REQ-31 CA2/CA6/CA8, REQ-33 y REQ-34. Reemplaza lo que contradiga a §11.

### 12.1 Flujo de la clase

```
/                  landing: conceptos clave interactivos + recorrido de la clase  (REQ-33)
/s1/s1-m1-…        módulo 1: Teoría → Práctica  ─┐
…                  módulos 2 a 7, en orden        ├─ «Siguiente módulo» al terminar
/s1/s1-m7-…        módulo 7                      ─┘  el último lleva a /s1/quiz
/s1/quiz           «Prepárate para el quiz»: reglas + entrar a la sala → quiz final  (REQ-34, REQ-29)
```

- Los módulos ya no tienen etapa Quiz. El esquema cambia: una lección no opcional debe recorrer `theory` y `practice`; la etapa `quiz` y el paso `quiz` dejan de existir dentro de las lecciones. Las preguntas de repaso (`question`) siguen en la Teoría, sin puntaje.
- El quiz final vive en `content/s1/quiz.json`, validado en el build con su propio esquema: `{ session, title, questions: { id, module, context?, prompt, options }[] }` con **exactamente 10 preguntas** (§12.5) y al menos una por cada módulo 1–7 que exista, más una `reserve` opcional que no se envía al navegador. Las mismas reglas de REQ-32 (contexto, longitud pareja).
- Las 10 preguntas son fijas e iguales para todos (no se sortean; solo se baraja su orden, §12.5): así el informe «Por pregunta» compara lo mismo entre estudiantes. Las preguntas actuales de los quizzes de los módulos 1 y 4 pasan a ser la reserva de la que salen las de esos módulos.
- En `quiz_answers`, `lesson_id` toma el valor `s1-quiz`. Las vistas `answer_times` y `room_ranking` no cambian.

### 12.2 Apertura del quiz por el docente

- Migración `web/supabase/002_quiz_live.sql` (reemplaza a `002_quiz_open.sql`, ver §12.5): `quiz_opened_at` y `quiz_closed_at` en `rooms`.
- `openQuiz(roomId)` fija `quiz_opened_at = now()` y vacía `quiz_closed_at`; `closeQuiz(roomId)` fija `quiz_closed_at = now()`. Estados: sin abrir (opened null), abierto (opened y closed null), cerrado (closed no null: se ven explicaciones y la franja final).
- `startQuestion` y `submitAnswer` con sala exigen `quiz_opened_at is not null` y `closed_at is null`; si no, responden «El docente aún no abre el quiz» y no guardan nada.
- `/s1/quiz` sin quiz abierto muestra las reglas y «Esperando a que el docente abra el quiz»; se refresca con `router.refresh()` cada 5 s mientras la pestaña está visible. Sin sala, el estudiante puede hacer el quiz en modo práctica, sin puntaje.

### 12.3 Sala y barra de sala

- Entrar a la sala ocurre en `/s1/quiz` (mismo formulario y Server Action `joinRoom` de T-40). `/sala` se mantiene para cambiar de sala.
- La barra de sala solo aparece cuando el estudiante ya está en una sala; antes no invita a entrar, porque la invitación está al final de los módulos.
- El código estudiantil es el del carné: no se verifica ni se envía por correo. El docente elimina participantes falsos desde el panel (REQ-28 CA5).

### 12.4 Landing (REQ-33)

- Secciones, en orden: hero con la identidad UPC → «Qué viaja entre tu código y la tabla» (mapa interactivo de las 4 piezas con una consulta que viaja) → conexión y pool → consulta segura (mini demo: el texto escrito cambia el SQL concatenado; con `PreparedStatement` no) → recorrido de la clase (módulos 1–7 con duración, módulo 8 opcional, quiz final) → botón «Empezar por el módulo 1».
- Ilustraciones: SVG propios con función didáctica (diagramas de piezas, conexión, pool). Logo UPC aportado por el autor. Sin estadísticas ni testimonios inventados (P8).
- React Bits en la portada: `SplitText`, `TextType` y `Threads` (§8.1), más `AnimatedContent` para revelar secciones al hacer scroll. Todo se desactiva con `prefers-reduced-motion` y en modo exposición; los conceptos se pueden usar con teclado.

### 12.5 Quiz evaluable: nota, tiempo e integridad (cambio del 6 nov 2026, noche)

Responde a REQ-29 CA1/CA3/CA5–CA7, REQ-30 CA1b, REQ-31 CA2/CA9, REQ-34 CA1/CA4 y REQ-35.

**Contenido y tiempo.** `quiz.json` tiene 10 preguntas y una `reserve`. `lib/quiz-time.ts` calcula el límite de cada pregunta (REQ-35 CA1); `toPublicQuiz` lo agrega como `seconds` y descarta `correct`, `explanation` y `reserve`. Tiempos del quiz actual: entre 35 y 60 s, unos 8 min en total. `gradeOf(aciertos, total)` da la nota de 0 a 5 con un decimal.

**Migración `web/supabase/002_quiz_live.sql`** (idempotente, la ejecuta el autor):

| Tabla | Columna nueva | Uso |
|---|---|---|
| `rooms` | `quiz_opened_at`, `quiz_closed_at` | Estado del quiz (§12.2) |
| `participants` | `exits smallint`, `blocked_at timestamptz` | Salidas de la pestaña y bloqueo (REQ-35 CA3) |
| `quiz_answers` | `limit_seconds smallint`, `timed_out boolean` | Límite fijado al mostrar la pregunta; respuesta vencida |

- La restricción de estado de `quiz_answers` cambia: pendiente (todo null) o respondida (`answered_at` y `correct` no null; `option_index` null solo si `timed_out`).
- `answer_times` y `room_ranking` se recrean: el tope de segundos es `limit_seconds` en vez de 60.
- Función `register_exit(p_participant uuid)`: suma una salida de forma atómica y bloquea al llegar a 2; devuelve `exits` y `blocked`. Rehabilitar (panel) deja `blocked_at = null` y `exits = 1`.

**Flujo del estudiante en `/s1/quiz`** (Server Component lee la cookie de participante):

| Estado | Pantalla |
|---|---|
| Sin sala | Reglas + `JoinRoomForm` (vuelve a `/s1/quiz`) + «Hacer el calentamiento»: `practice` de `quiz.json`, preguntas distintas a las reales; `submitQuizAnswer` solo califica esas |
| Sala, quiz sin abrir | Reglas + «Esperando a que el docente abra el quiz»; `router.refresh()` cada 5 s con la pestaña visible |
| Quiz abierto, bloqueado | «Quiz bloqueado: pide al docente que te rehabilite»; refresco cada 5 s |
| Quiz abierto, en curso | `LiveQuiz`: una pregunta por pantalla con cuenta regresiva |
| Terminó o quiz cerrado | Nota, aciertos y franja; con el quiz cerrado, además el detalle con explicaciones |

**Server Actions** (`app/actions/quiz.ts`), todas validan participante, sala abierta, quiz abierto y no bloqueado:

- `startQuestion(questionId)`: inserta `shown_at` y `limit_seconds` con `on conflict do nothing`; devuelve **solo esa pregunta** en su forma pública y los milisegundos que quedan según el reloj del servidor. El navegador nunca recibe las preguntas siguientes antes de tiempo.
- `submitQuizAnswer(questionId, optionIndex | null)`: guarda solo si `answered_at is null`. Si pasó el límite + 3 s, o `optionIndex` es null (se acabó el tiempo en pantalla), guarda `timed_out = true, correct = false`. Con sala devuelve solo `{ saved, timedOut }`; sin sala califica como antes (modo práctica).
- `reportExit()`: llama a `register_exit` y devuelve `{ exits, blocked }`.
- Al cargar la página, las preguntas pendientes cuyo límite ya pasó se cierran como vencidas, así recargar no regala tiempo.

**Orden por estudiante.** `seededOrder(n, semilla)` baraja con el id del participante: las preguntas con `<id>` y las opciones con `<id>-<pregunta>`. El servidor calcula el orden y lo envía como lista de ids.

**Franja.** Con el ranking de la sala (aciertos, luego tiempo), puesto `p` de `n`: Top 10 % si `p ≤ ⌈0,10·n⌉`, Top 25 % si `p ≤ ⌈0,25·n⌉`, Mitad superior si `p ≤ ⌈0,5·n⌉`, si no «Sigue practicando». Provisional mientras el quiz esté abierto.

**Integridad en el navegador** (REQ-35 CA3, CA5, CA6): `visibilitychange` a `hidden` llama a `reportExit` (no se usa `blur`, que da falsos positivos con notificaciones y ventanas divididas); al volver se muestra el aviso o el bloqueo. La zona de la pregunta usa `select-none` y cancela `copy`, `cut` y `contextmenu`. La marca de agua es texto repetido en diagonal con opacidad baja, `aria-hidden` y `pointer-events: none`.

