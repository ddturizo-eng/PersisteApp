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
│  │  ├─ layout.tsx            tema, fuente, ExpositionProvider, CommandPalette
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
- `ExpositionProvider` (contexto + `localStorage`) añade clase `data-exposition` al `<html>`: escala tipográfica ×1.35, oculta barra lateral y pie.
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

Regla: animación solo en la portada (`/`), una vez por visita, y nunca dentro de una lección, del modo exposición ni de los simuladores. Se instalan en variante TypeScript + Tailwind (`-TS-TW`) en `web/components/bits/`, y luego se adaptan a los tokens del proyecto.

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
