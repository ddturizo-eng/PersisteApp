# PersisteApp · Tareas (PASOS)

> Deriva de `01-requirements.md` y `02-design.md`. Capacidad supuesta: **1 desarrollador + Claude Code, ~12 h efectivas por día**. Estimaciones en horas; los story points del roadmap usan la misma escala.
> Estado: ✅ hecha · 🔄 en curso · ⬜ pendiente · ⏸️ pasada al backlog. Una tarea se cierra solo si cumple su DoD.

**DoD común a toda tarea de código:** compila sin errores ni warnings de tipo · lint limpio · funciona con teclado · probado en 375 px y escritorio · rótulo real/simulado presente si hay salida · commit atómico con Conventional Commits.

## Replanificación del 6 nov 2026 (mediodía)

Cambio de alcance aprobado por el autor (ver REQ-26 a REQ-30):

1. **Teoría primero, luego práctica** y construcción **en orden de módulos, del 1 al 8**. La lección modelo pasa del módulo 4 al módulo 1.
2. El ejercicio de ordenar bloques se reemplaza por el **recorrido «¿Dónde ocurre?»** (cronológico, una decisión por pantalla).
3. Entra en la v1 un **quiz por módulo con ranking por grupo** (sala con código + nombre y código estudiantil; los 3 primeros reciben décimas).

Restricción del MVP: **no hay VPS ni backend propio**; todo lo dinámico corre en funciones serverless de Vercel contra Supabase (P11).

Para que quepa en el plazo, pasan al backlog: buscador Ctrl K y Referencia (T-23), revisión con `impeccable` (T-26), PGlite (T-17, T-21), el mapa interactivo del módulo 1 (lo cubre el recorrido) y el módulo 8 en la versión del lunes (queda como estudio autónomo después).

## Replanificación del 6 nov 2026 (tarde)

Segundo cambio aprobado por el autor (REQ-26 y REQ-29 cambiados, REQ-33 y REQ-34 nuevos; diseño §12):

1. **Un solo quiz final de 12 preguntas** al terminar la sesión, en lugar de un quiz por módulo. Los módulos duran 10–15 min y quedan en **Teoría → Práctica**.
2. **El docente abre el quiz** para su sala; el estudiante entra a la sala en la página **«Prepárate para el quiz»**, al terminar el módulo 7.
3. **La portada pasa a ser una landing de conceptos** interactiva (identidad UPC) y se adelanta al sábado: es la entrada a la clase.
4. El código estudiantil es el del carné; no se verifica por correo (sin API externa).

**Ajuste del 6 nov 2026 (noche)** (REQ-29 CA1/CA3/CA5–CA7, REQ-35 nuevo; diseño §12.5): el quiz pasa a **10 preguntas con nota de 0 a 5**, tiempo por pregunta según su longitud (30–90 s), explicaciones al cerrar el quiz, franja (no puesto) para el estudiante, orden barajado por estudiante, detección de salidas con bloqueo a la segunda y botón Rehabilitar en el panel. Botón «Ir al quiz» en el encabezado.

---

## Día 1 · Vie 6 nov · Base

| ID | Tarea | REQ | Est. | Estado |
|---|---|---|---|---|
| T-01 | Repo git, `web/` con Next.js + TS + Tailwind + ESLint + Vitest | — | 0.75 h | ✅ |
| T-02 | Primer despliegue en Vercel | — | 0.25 h | ✅ |
| T-03 | Investigación UI con `ui-reference-intelligence` | REQ-02, 04, 05, 09 | 0.75 h | ✅ |
| T-04 | Tokens, tema claro/oscuro, componentes base | REQ-07, 09 | 1 h | ✅ |
| T-05 | Esquema zod y validación en build | REQ-01 | 1 h | ✅ |
| T-06 | `LessonPlayer` con texto, visual y pregunta | REQ-02, 03 | 2 h | ✅ |
| T-07 | Paso de código: Shiki, pestañas de motor, ejercicios, pistas y «Ver solución» | REQ-04 | 1.75 h | ✅ |
| T-08 | Modo Exposición: `P`, vista general `O`, cronómetro | REQ-05 | 0.5 h | ✅ |
| T-36 | Etapas Teoría → Práctica → Quiz en esquema, indicador y lección del módulo 4 | REQ-26 | 1 h | ✅ |
| T-37 | Paso `trace` «¿Dónde ocurre?» con pruebas; reemplaza el ordenar del módulo 4 | REQ-27 | 2 h | ✅ |
| T-45 | Calidad de preguntas: `context`, selector en huecos, control de longitud en build, opciones barajadas; módulo 4 reescrito | REQ-04 CA7, REQ-32 | 0.75 h | ✅ |
| T-38 | Paso `quiz` en modo práctica, calificado por Server Action sin exponer respuestas | REQ-29 CA1–CA4 | 1.5 h | ✅ |
| T-09 | **Lección modelo: módulo 1 «Mapa del sistema»** (teoría → recorrido → quiz) | REQ-16, 26 | 1.5 h | ✅ |
| T-12 | Enviar preguntas abiertas al docente | — | 0.1 h | ⬜ |

**Salida del viernes:** módulo 1 completo y desplegado, con teoría, recorrido y quiz en modo práctica.

## Día 2 · Sáb 7 nov · Sala, ranking y módulos 2–3

| ID | Tarea | REQ | Est. | Estado |
|---|---|---|---|---|
| T-39 | Proyecto Supabase, `supabase/001_quiz.sql` y `db/001_schema.sql`, variables en Vercel | REQ-19, 28 | 0.75 h | ✅ |
| T-40 | Sala: `joinRoom`, cookie httpOnly, página `/sala`, barra de sala | REQ-28 CA1–CA3 | 1.5 h | ✅ |
| T-46 | Quiz final: `content/s1/quiz.json` (10 preguntas + reserva) con esquema propio; módulos 1 y 4 sin etapa Quiz; «Siguiente módulo» al terminar; «Ir al quiz» en el encabezado | REQ-26, 29 CA1, 34 CA4 | 1.25 h | ✅ |
| T-47 | Landing de conceptos: hero UPC, mapa interactivo de las 4 piezas, conexión y pool, consulta segura, recorrido de la clase | REQ-33, REQ-06 | 3.5 h | 🔄 |
| T-41 | `/s1/quiz` «Prepárate para el quiz» con entrada a sala; `002_quiz_live.sql`; `startQuestion` y `submitAnswer` con límite por pregunta en servidor, primer intento y quiz abierto; nota, franja y explicaciones al cerrar | REQ-29, REQ-30 CA1b, REQ-34, REQ-35 CA1–CA2 | 2.5 h | ✅ |
| T-48 | Integridad: salidas de pestaña con aviso y bloqueo, sin copiar, marca de agua | REQ-35 CA3, CA5–CA7 | 1 h | ✅ |
| T-42 | Panel docente: clave, salas, **abrir/cerrar quiz**, pestañas En vivo (con nota y salidas), Por pregunta y Por estudiante, **Rehabilitar**, eliminar, cerrar, CSV | REQ-28 CA4–CA5, REQ-30 CA1, CA2, CA4, REQ-31, REQ-35 CA4 | 3.5 h | ✅ |
| T-43 | Ranking proyectado (top 10, nombre + inicial) | REQ-30 CA3 | 0.5 h | ✅ |
| T-18 | Módulo 2 «Primera conexión»: URL, driver, variables de entorno; recorrido reutilizado | REQ-16, 26, 27 | 1 h | ✅ |
| T-13 | Modelo puro del pool con pruebas | REQ-10 | 0.75 h | ✅ |
| T-14 | Simulador de pool y contenido del módulo 3 | REQ-10, 16 | 2.5 h | ✅ |
| T-11 | CRUD Java `v0-messy` y `v1-layered` contra Supabase | REQ-17, 18 | 2.25 h | ✅ |

**Salida del sábado:** landing de conceptos, quiz final y panel docente funcionando de punta a punta con una sala de prueba; módulos 1–3 completos.

> El sábado suma ≈ 13.5 h tras ampliar el panel (REQ-31). Si a las 18:00 no está T-11, el CRUD Java pasa al domingo temprano y T-16 (espejo) se recorta según la regla 1.

## Día 3 · Dom 8 nov · Módulos 4–7, pulido y ensayo

| ID | Tarea | REQ | Est. | Estado |
|---|---|---|---|---|
| T-15 | Laboratorio de inyección SQL | REQ-11 | 2 h | ⬜ |
| T-19 | Módulo 4: ajustar a teoría → práctica (sin quiz) y preguntas al quiz final | REQ-16, 26 | 0.5 h | ⬜ |
| T-16 | Espejo app ↔ base de datos (`MemoryDb`) | REQ-12 | 1.5 h | ✅ |
| T-20 | Módulos 5, 6 y 7, y sus preguntas en el quiz final | REQ-16, 26, 29 | 2.5 h | ✅ |
| T-22 | ~~Portada mínima~~ (la reemplaza T-47); progreso local en el índice de la landing | REQ-06 CA2 | 0.5 h | ✅ |
| T-24 | Pasada de accesibilidad y responsive | REQ-09 | 1 h | ✅ (falta probar el gesto del menú en iPhone real) |
| T-25 | Auditoría de rótulos real/simulado | REQ-07 | 0.25 h | ✅ |
| T-27 | Despliegue de producción + respaldo sin red | — | 0.5 h | ⬜ |
| T-28 | Ensayo de 100 min con sala de prueba | — | 2 h | ⬜ |
| T-29 | Corregir fallos del ensayo | — | 1 h | ⬜ |

**Salida del domingo (fin del plazo):** sesión 1 con landing, módulos 1–7, quiz final y ranking por grupo, desplegada y ensayada.

> El domingo suma ≈ 12.5 h. Si a las 14:00 del domingo no están cerrados T-15 y T-19, se aplica la regla de recorte 2.

---

## Backlog

| ID | Tarea | Motivo |
|---|---|---|
| T-23 | Buscador Ctrl K, Referencia y glosario | Recorte del 6 nov para dar lugar al ranking |
| T-26 | Revisión de acabado con `impeccable` | Recorte del 6 nov |
| T-17 / T-21 | PGlite: spike y laboratorio SQL real | Stretch; el espejo queda simulado |
| T-44 | Módulo 8 «Qué hace Spring Boot por ti» | Estudio autónomo; se publica después del lunes |
| T-31–T-35 | Sesión 2 (CRUD v2, rutinas, triggers, contenido, ensayo) | Lun 9 tarde y Mar 10 |
| REQ-21–25 | Fase 2 | Sin cambios |

## Matriz de trazabilidad

| REQ | Prioridad | Tareas |
|---|---|---|
| REQ-01 | M | T-05 |
| REQ-02, REQ-03 | M | T-06 |
| REQ-04 | M | T-07 |
| REQ-05 | M | T-08 |
| REQ-06 | S | T-22 |
| REQ-07 | M | T-04, T-25 |
| REQ-08 | S | T-23 ⏸️ |
| REQ-09 | M | T-04, T-24 |
| REQ-10 | M | T-13, T-14 |
| REQ-11 | M | T-15 |
| REQ-12 | M | T-16 |
| REQ-13 | S | cubierto por el recorrido del módulo 1 (T-09) |
| REQ-14 | C | cubierto en parte por el recorrido (T-37) |
| REQ-15 | C | T-17, T-21 ⏸️ |
| REQ-16 | M | T-09, T-18, T-14, T-19, T-20 |
| REQ-17, REQ-18 | M | T-11 |
| REQ-19 | M | T-39, T-11 |
| REQ-26 | M | T-36, T-46 y todas las lecciones |
| REQ-27 | M | T-37, T-09, T-18 |
| REQ-28 | M | T-39, T-40, T-42 |
| REQ-29 | M | T-38, T-46, T-41 |
| REQ-35 | M | T-41, T-48, T-42 |
| REQ-30 | M | T-41, T-42, T-43 |
| REQ-31 | M | T-42 |
| REQ-33 | M | T-47 |
| REQ-34 | M | T-41 |
| REQ-32 | M | T-45 (control de longitud en el esquema y preguntas del módulo 4 reescritas) y todas las lecciones |

## Reglas de recorte si el plan se atrasa

1. Primero cae el espejo app ↔ base de datos interactivo (T-16): el módulo 7 usa un diagrama y el quiz.
2. Luego los módulos 6 y 7 se reducen a teoría + quiz, sin práctica.
3. Luego el ranking proyectado (T-43): el docente muestra el panel directamente.
4. Nunca se recortan T-24, T-25, T-27 ni T-28, ni el ranking por grupo con CSV (T-40 a T-42): es el compromiso con el docente.
