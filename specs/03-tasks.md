# PersisteApp · Tareas (PASOS)

> Deriva de `01-requirements.md` y `02-design.md`. Capacidad supuesta: **1 desarrollador + Claude Code, ~12 h efectivas por día** (≈ 36 h en 3 días; plan comprometido ≈ 34 h, el resto es stretch). Estimaciones en horas; los story points del roadmap usan la misma escala.
> Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecha. Una tarea se cierra solo si cumple su DoD.

**DoD común a toda tarea de código:** compila sin errores ni warnings de tipo · lint limpio · funciona con teclado · probado en 375 px y escritorio · rótulo real/simulado presente si hay salida · commit atómico con Conventional Commits.

---

## Día 1 · Vie 6 nov · Base (≈ 12 h)

| ID | Tarea | REQ | Est. | Depende | DoD específico |
|---|---|---|---|---|---|
| T-01 | Inicializar repo git, `web/` con Next.js + TS + Tailwind + ESLint + Vitest, `.gitignore` con `.env*` | — | 0.75 h | — | `npm run build` y `npm test` pasan |
| T-02 | Primer despliegue en Vercel (preview) | — | 0.25 h | T-01 | URL pública responde |
| T-03 | Investigación UI con skill `ui-reference-intelligence` (timebox): reproductor de lección, modo exposición, bloque de código con pestañas | REQ-02, 04, 05, 09 | 0.75 h | — | `docs/ui-research.md` con ≥ 3 referencias por objetivo y dirección recomendada |
| T-04 | Tokens de diseño, tema claro/oscuro, layout base, `ExecutionBadge`, `Button`, `Kbd` | REQ-07, 09 | 1 h | T-01, T-03 | contraste AA verificado en ambos temas |
| T-05 | Esquema zod de lección + `content.ts` que valida en build | REQ-01 | 1 h | T-01 | JSON inválido rompe el build con archivo y campo |
| T-06 | `LessonPlayer` + pasos `text`, `visual`, `question` + barra de progreso + atajos `←` `→` | REQ-02, 03 | 2 h | T-04, T-05 | Continuar bloqueado sin respuesta; error explica causa |
| T-07 | Paso `code`: `CodeTabs` (Oracle/PostgreSQL), `PickLine`, `OrderBlocks`, `FillGaps` | REQ-04 | 1.75 h | T-06 | las tres interacciones completables solo con teclado |
| T-08 | Modo Exposición (`P`), persistente entre pasos | REQ-05 | 0.5 h | T-06 | legible a 3 m en proyector (prueba con zoom 150 %) |
| T-09 | Lección modelo completa: módulo 4 "Consultas seguras" (seis etapas) | REQ-16 | 1 h | T-07 | recorre Problema → Explicar; sirve de plantilla |
| T-10 | Supabase: proyecto, `db/001_schema.sql` + `002_seed.sql` (products, sales) | REQ-19 | 0.5 h | — | tablas con FK y 10 productos de semilla |
| T-11 | CRUD `v0-messy` y `v1-layered` (Maven, Java 17, HikariCP, `TransactionRunner`, `registerSale`) + pruebas de servicio | REQ-17, 18 | 2.25 h | T-10 | `mvn verify` pasa; JaCoCo ≥ 70 % en service; v1 conecta a Supabase con env vars |
| T-12 | Enviar al docente las dos preguntas abiertas (estándares extra, rúbrica) | — | 0.1 h | — | mensaje enviado por Daniel |

**Salida del viernes:** app desplegada con una lección real recorrible en modo exposición; CRUD v0/v1 funcionando contra Supabase.

---

## Día 2 · Sáb 7 nov · Sesión 1 (≈ 10.75 h + 2 h stretch)

| ID | Tarea | REQ | Est. | Depende | DoD específico |
|---|---|---|---|---|---|
| T-13 | Modelo puro del pool + pruebas Vitest | REQ-10 | 0.75 h | T-01 | prueba: sin pool > con pool en tiempo medio para 50 peticiones |
| T-14 | Vista `PoolSimulator` (slider, ráfaga, rejilla, cola, comparación) | REQ-10 | 1.75 h | T-13, T-06 | escenario sin pool vs con pool lado a lado |
| T-15 | `InjectionLab`: `buildQuery` + pruebas, vista con SQL en vivo e interruptor | REQ-11 | 2 h | T-07 | `' OR '1'='1` entra en vulnerable y falla en seguro |
| T-16 | `AppDbMirror` con adaptador `MirrorDb` y `MemoryDb` (commit / rollback forzado) | REQ-12 | 1.75 h | T-06 | rollback deja la tabla sin cambios; rótulo `Simulación` |
| T-17 | Spike PGlite (timebox): carga en Next, transacciones, prueba de `plpgsql` y trigger | REQ-15, 20 | 1 h | T-01 | nota en `docs/pglite-spike.md`: funciona / no funciona y por qué |
| T-18 | Contenido módulos 1, 2, 3 (con `SystemMap` en versión selección por teclado) | REQ-13, 16 | 1.5 h | T-09, T-14 | tres lecciones válidas en build |
| T-19 | Contenido módulos 5, 6, 7 (6 con diagrama estático de capas) | REQ-16 | 1.5 h | T-09, T-16 | tres lecciones válidas; 7 usa el espejo |
| T-20 | Contenido módulo 8: tabla manual ↔ Spring Boot, rotulado opcional | REQ-06, 16 | 0.5 h | T-09 | aparece como "Estudio autónomo" |
| T-21 | *Stretch:* `PgliteDb` para el espejo + página `/lab/sql` con restaurar | REQ-12 CA4, 15 | 2 h | T-17 ✓ | solo si T-17 dio "funciona"; carga diferida verificada en Network |

**Salida del sábado:** los 8 módulos recorribles; tres simuladores M funcionando.

---

## Día 3 · Dom 8 nov · Pulido, despliegue y ensayo (≈ 11 h)

| ID | Tarea | REQ | Est. | Depende | DoD específico |
|---|---|---|---|---|---|
| T-22 | Portada con React Bits (`SplitText`, `TextType`, `Threads`; ver 02-design §8.1) + índice del curso con tiempos + progreso en `localStorage` | REQ-06 | 1.5 h | T-18..20 | lecciones completadas se marcan tras recargar |
| T-23 | `CommandPalette` Ctrl K + página Referencia (JDBC, patrones, errores) + `GlossaryTerm` | REQ-08 | 1.5 h | T-05 | busca lecciones y referencias; glosario con 4 términos |
| T-24 | Pasada de accesibilidad y responsive (teclado, foco, 375 px, reduced motion) | REQ-09 | 1.25 h | todo UI | checklist de REQ-09 en verde |
| T-25 | Auditoría de rótulos real/simulado en todas las salidas | REQ-07 | 0.5 h | todo UI | cero salidas sin rótulo |
| T-26 | Revisión de acabado con skill `impeccable` y corrección de hallazgos críticos | P8 | 1 h | T-24 | solo se corrigen hallazgos de severidad alta |
| T-27 | Despliegue de producción en Vercel + smoke test + prueba con build local sin red | — | 0.5 h | T-22..26 | URL de producción; `next start` local funciona como respaldo |
| T-28 | Ensayo completo de 100 min con el guion de minutos del documento | — | 2 h | T-27 | lista de fallos priorizada |
| T-29 | Corregir fallos del ensayo | — | 1.5 h | T-28 | fallos altos cerrados |
| T-30 | Buffer de imprevistos | — | 1.25 h | — | — |

**Salida del domingo (fin del plazo):** sesión 1 desplegada, ensayada y con respaldo offline.

---

## Fuera del plazo de 3 días

### Lun 9 tarde + Mar 10 · Sesión 2 (REQ-20)

| ID | Tarea | Est. |
|---|---|---|
| T-31 | CRUD `v2-routines`: CallableStatement, función, procedimiento IN/OUT `register_sale`, traducción de errores | 3 h |
| T-32 | Scripts SQL de rutinas y trigger de bitácora (Oracle y PostgreSQL) | 1.5 h |
| T-33 | Contenido módulos S2-1 a S2-7 | 5 h |
| T-34 | Visual "trigger en paralelo" (con PGlite si el spike lo permitió, si no simulado) | 2 h |
| T-35 | Ensayo sesión 2 | 1.5 h |

### Fase 2 (REQ-21..25)
Editor Java ejecutable aislado · esquema por estudiante · cuentas y progreso en Supabase · rúbrica automatizada · revisión tipo jurado · refactor guiado · detector de fugas.

---

## Matriz de trazabilidad

| REQ | Prioridad | Tareas |
|---|---|---|
| REQ-01 | M | T-05 |
| REQ-02 | M | T-03, T-06 |
| REQ-03 | M | T-06 |
| REQ-04 | M | T-03, T-07 |
| REQ-05 | M | T-03, T-08 |
| REQ-06 | S | T-20, T-22 |
| REQ-07 | M | T-04, T-25 |
| REQ-08 | S | T-23 |
| REQ-09 | M | T-03, T-04, T-24 |
| REQ-10 | M | T-13, T-14 |
| REQ-11 | M | T-15 |
| REQ-12 | M | T-16, T-21 |
| REQ-13 | S | T-18 |
| REQ-14 | C | — (entra solo si sobra buffer) |
| REQ-15 | C | T-17, T-21 |
| REQ-16 | M | T-09, T-18, T-19, T-20 |
| REQ-17 | M | T-11 |
| REQ-18 | M | T-11 |
| REQ-19 | M | T-10, T-11 |
| REQ-20 | W | T-17 (spike), T-31..35 |

## Reglas de recorte si el plan se atrasa

1. Primero cae REQ-14 y T-21 (stretch).
2. Luego REQ-13 pasa a diagrama estático sin interacción.
3. Luego REQ-08 se reduce a la página Referencia sin Ctrl K.
4. Nunca se recortan T-24, T-25, T-27 ni T-28: sin accesibilidad, rótulos, despliegue y ensayo no hay clase.
