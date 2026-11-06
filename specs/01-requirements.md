# PersisteApp · Requisitos (QUÉ)

> Alcance: versión 1, sesión 1, plazo de 3 días (6–8 nov 2026). Prioridad MoSCoW: **M** = Must (sin esto no hay clase el lunes), **S** = Should (se hace si el plan va en tiempo), **C** = Could (stretch), **W** = Won't (fuera de v1).
> Criterios en formato EARS. Cada criterio se verifica a mano o con prueba antes de cerrar la tarea.

## Actores

- **Estudiante:** Ingeniería de Sistemas, sabe SQL y Java, nunca los integró. Usa celular o portátil.
- **Docente / expositor (Daniel):** proyecta la plataforma, ejecuta el CRUD Java en su equipo.

---

## Núcleo de la plataforma

### REQ-01 · Lecciones como datos — **M**
Como autor, quiero escribir cada lección como un archivo JSON para invertir el tiempo en contenido y no en pantallas.
- **CA1.** Cuando se agrega un archivo de lección válido en `content/`, el sistema debe mostrarlo en el índice del curso sin cambiar código.
- **CA2.** Si un archivo de lección no cumple el esquema, el build debe fallar con el nombre del archivo y el campo inválido.
- **CA3.** Cada lección debe declarar: id, módulo, título con gancho, tiempo estimado, fuente oficial y lista de pasos.

### REQ-02 · Renderizador de pasos — **M**
Como estudiante, quiero recorrer una lección paso a paso con un botón Continuar.
- **CA1.** El sistema debe soportar cuatro tipos de paso: `text`, `visual`, `question`, `code`.
- **CA2.** Cada pantalla debe mostrar una sola idea y el progreso dentro de la lección (paso n de m).
- **CA3.** Cuando el estudiante pulsa Continuar o la tecla `→`, el sistema debe avanzar; con `←` debe retroceder.
- **CA4.** Mientras un paso `question` no tenga respuesta, el botón Continuar debe estar deshabilitado.

### REQ-03 · Preguntas con retroalimentación — **M**
- **CA1.** Cuando el estudiante elige una opción incorrecta, el sistema debe explicar la causa del error, no solo marcarla.
- **CA2.** Cuando elige la correcta, el sistema debe mostrar una explicación breve y habilitar Continuar.

### REQ-04 · Código guiado (nivel 1) — **M**
Como estudiante, quiero practicar con fragmentos Java sin escribir un programa completo.
- **CA1.** El sistema debe soportar tres interacciones: elegir la línea correcta, ordenar bloques y completar huecos.
- **CA2.** Cada fragmento debe mostrar pestañas Oracle / PostgreSQL cuando el código difiera entre motores.
- **CA3.** Todo resultado de estas prácticas debe rotularse como `Simulación` (ver REQ-07).
- **CA4.** Las interacciones deben poder completarse solo con teclado.
- **CA5.** Ningún ejercicio debe dejar al estudiante bloqueado: tras cada intento fallido el sistema debe mostrar la siguiente pista, y tras 2 intentos fallidos debe ofrecer «Ver solución». *(Agregado el 6 nov 2026 tras revisión de contenido: riesgo de abandono en el ejercicio de ordenar.)*
- **CA6.** Después de comprobar, el ejercicio de ordenar debe marcar qué bloques ya están en su lugar.
- **CA7.** Cada hueco de un ejercicio de completar puede ofrecer una lista de opciones (selector); con lista, el estudiante elige en vez de escribir. *(6 nov 2026: más rápido en clase y sin errores de tipeo.)*

### REQ-32 · Calidad de las preguntas — **M**
*(Agregado el 6 nov 2026 tras revisar el módulo 4: preguntas demasiado implícitas y respuestas adivinables por su longitud.)*
- **CA1.** Toda pregunta (repaso, elegir línea y quiz) puede llevar un `context`: la situación o el fragmento de código sobre el que se pregunta, visible antes del enunciado.
- **CA2.** El enunciado nombra explícitamente la clase, la línea o la situación por la que pregunta; no depende de recordar un paso anterior.
- **CA3.** La opción correcta no debe ser más de 20 % más larga que la opción incorrecta más larga ni más de 20 % más corta que la incorrecta más corta. El build falla si se incumple.
- **CA4.** Las opciones incorrectas son errores reales y plausibles (lo que un estudiante haría), no opciones absurdas.
- **CA5.** Las opciones se muestran en un orden barajado de forma determinista (igual en servidor y navegador), para que la correcta no quede siempre en la misma posición.

### REQ-05 · Modo Exposición — **M**
- **CA1.** Cuando se activa (tecla `P` o botón), el sistema debe ocultar navegación secundaria y aumentar tipografía para proyector.
- **CA2.** El modo debe conservarse al cambiar de paso y de lección.

### REQ-06 · Navegación del curso y progreso local — **S**
- **CA1.** El sistema debe mostrar la sesión 1 como curso con sus 8 módulos, orden y tiempo estimado.
- **CA2.** El sistema debe guardar en `localStorage` las lecciones completadas y marcarlas en el índice.
- **CA3.** El módulo 8 (Spring Boot) debe aparecer rotulado como opcional / estudio autónomo.

### REQ-07 · Rotulado real / simulado — **M**
- **CA1.** Toda salida de una práctica debe llevar un rótulo visible `Ejecución real` o `Simulación`.
- **CA2.** El rótulo debe tener texto, no solo color.

### REQ-08 · Buscador Ctrl K y Referencia — **S**
- **CA1.** Cuando el usuario pulsa `Ctrl K` / `⌘ K`, el sistema debe abrir un buscador sobre lecciones y entradas de referencia.
- **CA2.** La sección Referencia debe incluir chuleta de JDBC, patrones (DAO/Repository, capas) y errores frecuentes.
- **CA3.** El glosario (pool, DAO, commit, DTO) debe abrirse al tocar la palabra marcada dentro de un paso.

### REQ-09 · Accesibilidad y responsive — **M**
- **CA1.** Toda acción debe ser alcanzable con teclado y tener foco visible.
- **CA2.** Texto y controles deben cumplir contraste WCAG AA en tema claro y oscuro.
- **CA3.** El recorrido de una lección debe funcionar a 375 px de ancho sin desplazamiento horizontal.
- **CA4.** Las animaciones deben respetar `prefers-reduced-motion`.

---

## Módulos interactivos de la sesión 1

### REQ-10 · Simulador de pool — **M** (módulo 3)
- **CA1.** El usuario debe poder elegir tamaño del pool (1–20) y lanzar una ráfaga de 50 peticiones.
- **CA2.** El sistema debe mostrar conexiones ocupadas, cola de espera y tiempo medio de respuesta.
- **CA3.** El sistema debe comparar el mismo escenario sin pool (conexión nueva por petición) y con pool.
- **CA4.** El resultado se rotula como `Simulación`.

### REQ-11 · Laboratorio de inyección SQL — **M** (módulo 4)
- **CA1.** El sistema debe mostrar un login vulnerable con SQL concatenado y la consulta resultante en vivo mientras el usuario escribe.
- **CA2.** Cuando el usuario introduce `' OR '1'='1`, la versión vulnerable debe "entrar" y mostrar por qué.
- **CA3.** Con el interruptor en modo seguro (PreparedStatement), el mismo texto debe tratarse como dato y fallar el login.
- **CA4.** El código Java de ambas versiones debe verse junto al resultado.

### REQ-12 · Espejo app ↔ base de datos — **M** (módulo 7)
- **CA1.** El sistema debe mostrar en pantalla dividida un formulario de registro y la tabla `products` en vivo.
- **CA2.** Cuando el usuario registra con autocommit, la fila debe aparecer en la tabla.
- **CA3.** Cuando el usuario fuerza un fallo dentro de una transacción, el sistema debe mostrar el rollback y la tabla sin cambios.
- **CA4.** Si PGlite está activo, el rótulo debe ser `Ejecución real`; si no, `Simulación`.

### REQ-13 · Mapa del sistema — **S** (módulo 1)
- **CA1.** El usuario debe ubicar Aplicación, Driver JDBC, Red y Base de datos en su lugar (arrastrar o seleccionar con teclado).
- **CA2.** Al completarlo, el sistema debe animar el recorrido de una consulta por las piezas.

### REQ-14 · Rastreador de petición — **C** (módulo 6)
- **CA1.** El sistema debe animar clic → controlador → servicio → repositorio → pool → SQL → fila, resaltando la clase Java de cada paso.

### REQ-15 · Laboratorio SQL real en el navegador (nivel 2) — **C**
- **CA1.** El usuario debe poder ejecutar INSERT, UPDATE, DELETE, BEGIN, COMMIT y ROLLBACK sobre `products` con PGlite.
- **CA2.** PGlite debe cargarse solo al abrir el laboratorio (no en la carga inicial).
- **CA3.** Un botón debe restaurar la tabla a su estado inicial.

### REQ-16 · Contenido de los 8 módulos — **M**
- **CA1.** Cada módulo 1–7 debe tener al menos una lección completa con su actividad; el módulo 8 al menos la tabla de equivalencias Spring.
- ~~**CA2.** Cada lección debe seguir el recorrido Problema → Visualizar → Predecir → Escribir → Ejecutar → Explicar.~~ Reemplazado por REQ-26 (6 nov 2026).
- **CA3.** El paso Explicar debe usar el formato de bitácora de IA del docente (motivo, problema, prompt, solución).

---

## CRUD de referencia (Java)

### REQ-17 · CRUD v0 desordenado — **M**
- **CA1.** El proyecto debe compilar con Maven y Java 17.
- **CA2.** Debe contener SQL concatenado en la UI de consola y una conexión nueva por consulta, a propósito, para la demo de ataque.

### REQ-18 · CRUD v1 con capas — **M**
- **CA1.** Paquetes `model`, `persistence`, `service`, `ui`; `Main` crea e inyecta por constructor.
- **CA2.** `ProductStore` (interfaz por operaciones: save, update, delete, findById, findAll) implementada por `JdbcProductRepository` con PreparedStatement y try-with-resources.
- **CA3.** Pool HikariCP con credenciales leídas de variables de entorno.
- **CA4.** `registerSale(productId, quantity)` inserta la venta y descuenta stock en una transacción; si falla, rollback.
- **CA5.** Cambiar de PostgreSQL a Oracle solo debe requerir cambiar URL y driver.
- **CA6.** Pruebas del servicio con Mockito; JaCoCo ≥ 70 % en `service`.

### REQ-19 · Base de demo en Supabase — **M**
- **CA1.** Tablas `products` y `sales` con FK, creadas por un script SQL versionado.
- **CA2.** El CRUD v1 debe conectarse a Supabase desde el equipo del docente usando variables de entorno.

---

## Cambio de alcance del 6 nov 2026: teoría primero, quiz y ranking

> Origen: revisión de contenido con el autor. Los estudiantes necesitan base teórica antes de practicar, y el docente quiere premiar a los 3 primeros de cada grupo con décimas. Se construye en orden de módulos, del 1 al 8.

### REQ-26 · Lección en tres etapas: Teoría → Práctica → Quiz — **M**
Reemplaza las seis etapas de REQ-16 CA2.
- **CA1.** Cada lección debe recorrer, en este orden, Teoría (texto, visual, glosario), Práctica (ejercicios guiados sin calificación) y Quiz (preguntas calificadas).
- **CA2.** El indicador de etapas debe mostrar las tres etapas con su estado.
- **CA3.** La bitácora de IA (REQ-16 CA3) se mantiene como último paso de la Práctica.

### REQ-27 · Recorrido «¿Dónde ocurre?» — **M**
Reemplaza al ejercicio de ordenar bloques en el módulo 4 y se reutiliza en el módulo 2.
- **CA1.** El sistema debe presentar los eventos de una petición en orden cronológico, uno por pantalla (por ejemplo: leer variables de entorno, crear el pool, pedir una conexión, preparar, ejecutar, cerrar).
- **CA2.** En cada evento el estudiante debe elegir dónde ocurre (archivo o clase) entre 3 y 4 opciones.
- **CA3.** Una opción incorrecta debe explicar por qué no es ahí; la correcta debe mostrar el fragmento de código de ese momento y habilitar el siguiente evento.
- **CA4.** Al terminar el recorrido, el sistema debe mostrar la línea de tiempo completa (evento → lugar) como resumen.
- **CA5.** Todo el recorrido debe poder completarse con teclado.

### REQ-28 · Sala del grupo — **M**
- **CA1.** El docente debe poder crear una sala por grupo (por ejemplo «Grupo 8:00») que genera un código corto de 6 caracteres.
- **CA2.** El estudiante debe entrar con el código de sala, su nombre y su código estudiantil, sin contraseña.
- **CA3.** Si el mismo código estudiantil entra dos veces a la misma sala, el sistema debe reconocerlo como el mismo participante.
- **CA4.** El panel docente debe estar protegido por una clave guardada solo en el servidor (`TEACHER_PASSCODE`).
- **CA5.** El docente debe poder eliminar un participante (nombres falsos) y cerrar la sala para que no entren más respuestas.

### REQ-29 · Quiz calificado por módulo — **M**
- **CA1.** Cada lección debe terminar con un quiz de 4 a 6 preguntas de opción única.
- **CA2.** Las respuestas correctas no deben enviarse al navegador; el servidor califica cada respuesta (P10).
- **CA3.** Solo el primer intento de cada pregunta suma puntos; después el estudiante ve la explicación y puede seguir.
- **CA4.** Sin sala activa, el quiz debe funcionar en modo práctica, rotulado «Sin puntaje», sin guardar nada.
- **CA5.** Al terminar el quiz, el estudiante debe ver su puntaje del módulo y su posición en el grupo.

### REQ-30 · Ranking por grupo — **M**
- **CA1.** El ranking debe ordenar a los participantes de una sala por aciertos totales; el empate lo gana quien sumó menos tiempo en sus respuestas correctas. *(Decisión del 6 nov 2026: el tiempo solo desempata; no da puntos.)*
- **CA1b.** El tiempo de cada pregunta lo mide el servidor, desde que entrega la pregunta hasta que recibe la respuesta, con un tope de 60 s por pregunta. Recargar la página no reinicia el reloj.
- **CA2.** El panel docente debe mostrar el ranking actualizado cada 5 segundos como máximo y destacar los 3 primeros lugares.
- **CA3.** El modo exposición debe poder proyectar el top 10 con nombre y la inicial del apellido, nunca con el código estudiantil.
- **CA4.** El docente debe poder exportar el ranking completo a CSV (nombre, código, aciertos, tiempo, puesto y detalle por pregunta) para asignar las décimas.

### REQ-31 · Panel docente con reportes — **M**
- **CA1.** El panel debe listar las salas con su código, estado (abierta/cerrada) y número de participantes, y mostrar el código en grande para proyectarlo.
- **CA2.** La vista **En vivo** debe mostrar por estudiante: módulo en que va, aciertos, tiempo y puesto, y actualizarse cada 5 s como máximo.
- **CA3.** La vista **Por pregunta** debe mostrar por cada pregunta el % de aciertos, cuántos eligieron cada opción y el tiempo promedio, y marcar las que tengan menos de 50 % de aciertos.
- **CA4.** Al tocar una opción en la vista Por pregunta, el sistema debe listar qué estudiantes la eligieron.
- **CA5.** La vista **Por estudiante** debe mostrar cada respuesta: opción elegida, si fue correcta y el tiempo.
- **CA6.** El progreso de un estudiante se deriva de sus respuestas: un módulo está terminado cuando respondió todas sus preguntas del quiz.
- **CA7.** La bitácora de IA no se envía al panel; se queda en el navegador del estudiante.

---

## Fuera de la versión de 3 días — **W**

| ID | Qué | Cuándo |
|---|---|---|
| REQ-20 | Sesión 2: funciones, procedimientos IN/OUT, errores, triggers, rutinas detrás del repositorio, migraciones; CRUD v2 | Lun 9 (tarde) y Mar 10 nov |
| REQ-21 | Editor Java ejecutable en contenedor aislado | Fase 2 |
| REQ-22 | Esquema por estudiante en Supabase, restaurable | Fase 2 |
| REQ-23 | Cuentas y progreso sincronizado en Supabase | Fase 2 |
| REQ-24 | Rúbrica automatizada y revisión tipo jurado (8 defectos) | Fase 2 |
| REQ-25 | Refactor guiado SOLID/GRASP interactivo y detector de fugas | Fase 2 (salvo que sobre tiempo el sábado) |
| — | Audio narrado, videos, varios idiomas, asistente IA, apps móviles | Fuera de alcance |

## Decisiones abiertas

- [ ] ¿El docente adopta la rúbrica para el proyecto final? (no bloquea el desarrollo)
- [ ] ¿Hay estándares extra (nombres de tablas, formato de commits)? Preguntar el viernes; afecta REQ-18/19.
- [ ] ¿PGlite soporta triggers y PL/pgSQL? Spike el sábado; afecta REQ-20.
