# PA-3 · Investigación UI (skill `ui-reference-intelligence`)

> Fecha: 6 nov 2026 · Timebox: 45 min · Cubre REQ-02, REQ-04, REQ-05, REQ-09.
> Contexto: el proyecto aún no tiene sistema de diseño (solo el scaffold de PA-1). La fuente de verdad son los principios de [`specs/00-constitution.md`](../specs/00-constitution.md): P1 rotular real/simulado, P5 un solo renderizador, P7 accesible en aula, P8 sin relleno. Estas recomendaciones alimentan PA-4 (tokens) y PA-6/PA-7/PA-8.

## Problema por resolver

| Objetivo | Quién lo usa | Qué debe mostrar | Qué acciones |
|---|---|---|---|
| 1. Reproductor de lección paso a paso | Estudiante en celular o portátil | Una idea por pantalla, en qué paso va, en qué etapa (Problema → Explicar) | Continuar, volver, responder, retomar |
| 2. Modo Exposición | Docente proyectando a ~3 m | Solo el contenido del paso, legible desde el fondo del aula | Avanzar y retroceder con teclado, saltar a un paso |
| 3. Bloque de código con pestañas y ejercicios | Estudiante | Java o SQL con variante Oracle / PostgreSQL; ejercicios elegir línea, ordenar y completar | Cambiar de motor, elegir, reordenar, rellenar, comprobar |

---

## Referencias revisadas

| # | Referencia | Tipo | Qué aporta |
|---|---|---|---|
| R1 | [DB LAB](https://sql-select-lab.vercel.app/) | Producción (referencia directa del proyecto) | Progreso "0 de 79 lecciones" y por sección con %. Modo Estudio y Modo Exposición (`/presentation`) separados. Buscador Ctrl K con ↑ ↓, Enter y Escape. Rótulos "Vista educativa" y "Resultado real", más la regla de nunca presentar una simulación como ejecución real. |
| R2 | [Gurwi](https://gurwi.com/) | Producción | Un pasaje o pregunta por pantalla con "Continuar". "Repaso rápido" con 3 opciones y explicación si fallas. Términos en negrita con definición. Tiempo del curso ("12 min"). |
| R3 | [Carbon · Progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/) | Sistema de diseño | Usar solo en procesos lineales de 3 o más pasos. Estados completado, actual, no iniciado, error y deshabilitado. Navegación con ← → si es interactivo. |
| R4 | [USWDS · Step indicator](https://designsystem.digital.gov/components/step-indicator/) | Sistema de diseño | Variantes con etiquetas, sin etiquetas y con contadores. `aria-current="true"` en el paso actual. Texto oculto "completado / no completado". Encabezado justo debajo del indicador. Aprobado en WCAG 2.1 AA. |
| R5 | [W3C APG · Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | Especificación | Roles `tablist` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`. ← → con ciclo, Home / End. Activación automática recomendada si el panel aparece sin retraso. |
| R6 | [reveal.js · Speaker view](https://revealjs.com/speaker-view/) y [Overview](https://revealjs.com/overview/) | Producción (herramienta de presentación) | `S` abre notas, vista del siguiente paso y tiempo transcurrido. `Esc` / `O` abre una vista general para saltar entre diapositivas. |
| R7 | [Atlassian · Pragmatic drag and drop, accesibilidad](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/) | Sistema de diseño | Siempre ofrecer una alternativa al arrastre. Anunciar los movimientos en una región viva. Dar instrucciones de teclado, porque no hay un patrón estándar. |

---

## Hallazgos comparados

**1. Reproductor de lección**
- R1 y R2 coinciden: el progreso se muestra como texto ("n de m"), no solo como barra. R2 demuestra que un paso por pantalla con Continuar basta y no necesita navegación lateral.
- R3 y R4 advierten que el indicador por pasos sirve si los pasos son lineales y fijos. Las seis etapas de PersisteApp lo son. Los pasos individuales (8–15 por lección) no: demasiados para un indicador con etiquetas.
- R2 explica el error en el momento ("si fallas, te explica por qué"), igual que REQ-03.

**2. Modo Exposición**
- R1 separa Estudio y Exposición como modos de la misma lección, no como contenido duplicado. Encaja con P5.
- R6 muestra lo que necesita quien proyecta: teclas de una letra, vista general para saltar y tiempo transcurrido. Para 100 minutos con un guion de bloques, el tiempo es útil. Las notas en ventana aparte no, porque el docente proyecta y presenta desde la misma pantalla.

**3. Código con pestañas y ejercicios**
- R5 da el contrato exacto de teclado y ARIA para las pestañas Oracle / PostgreSQL.
- La elección de motor debería sincronizarse en toda la plataforma. Docusaurus lo resuelve con `groupId` ([plugin tab-blocks](https://www.github.com/mrazauskas/docusaurus-remark-plugin-tab-blocks)). Hay un [bug reportado](https://github-redirect.dependabot.com/facebook/docusaurus/issues/8473) de sincronización que no falló de forma obvia, así que conviene probarlo.
- Para ordenar bloques (Parsons), R7 obliga a una alternativa sin arrastre. El formato de Runestone (bloques de origen a destino, más bloques distractores) es el estándar académico. Su página no cargó (403), así que no se verificó su interfaz.

---

## Dirección recomendada

### 1. Reproductor de lección (`LessonPlayer`)

**Adoptar**
- Cabecera fija de una línea: `Módulo 4 · Consultas seguras` a la izquierda y `Paso 3 de 11` a la derecha (R1, R2).
- Bajo la cabecera, un indicador de las **seis etapas**, no de los pasos: Problema · Visualizar · Predecir · Escribir · Ejecutar · Explicar. La etapa actual lleva `aria-current="step"` y las anteriores, texto oculto "completada" (R3, R4).
- Barra fina continua para los pasos, decorativa, con `aria-hidden`; el texto "Paso n de m" es lo que lee el lector de pantalla.
- Pie con `Volver` (secundario) y `Continuar` (primario) siempre en el mismo lugar. Continuar queda deshabilitado mientras una pregunta no tenga respuesta, con texto auxiliar "Responde para continuar" (REQ-02 CA4).
- Retroalimentación en línea bajo la opción elegida: título "Correcto" o "No exactamente" y la causa en una o dos frases (R2, REQ-03). Además del color, un icono y una palabra.
- Ancho de lectura de 68 caracteres como máximo en texto y hasta 960 px para pasos de código o simulador.

**Evitar**
- Barra lateral con todos los pasos: compite con la idea única por pantalla.
- Confeti, rachas, puntos o tarjetas de estadísticas. No miden comprensión (P8).

### 2. Modo Exposición

**Adoptar**
- Es la misma ruta y el mismo componente, con un atributo `data-exposition` en `<html>` (R1).
- Tipografía de cuerpo de 28 px como mínimo (`clamp` según el ancho), código de 22 px como mínimo y contraste AAA en texto, porque los proyectores lavan los colores.
- Se oculta la cabecera global y el pie de navegación. Solo queda un borde inferior con `Paso n de m` y el tiempo transcurrido de la sesión (R6).
- Teclas: `→` / `Espacio` avanzan, `←` retrocede, `P` entra y sale del modo, `O` abre una vista general con las etapas y pasos de la lección para saltar (R6), `Esc` la cierra.
- En el pie va una ayuda discreta "`?` atajos", que abre la lista de teclas.

**Evitar**
- Notas en ventana aparte: añaden complejidad sin uso real en esta clase.
- Animaciones de transición de más de 150 ms. En proyector se ven como parpadeo.

### 3. Bloque de código y ejercicios

**Pestañas de motor (`CodeTabs`)**
- Patrón de R5 con activación automática: `tablist` con etiqueta "Motor de base de datos", ← → con ciclo, Home / End.
- La elección se guarda en `localStorage` (`persisteapp.engine`) y se aplica a todos los bloques. Solo se muestran pestañas si el fragmento tiene más de una variante.
- El rótulo `ExecutionBadge` (Simulación / Ejecución real) va en la cabecera del bloque de salida, no del código (P1, R1).
- Hay botón "Copiar" con confirmación en una región viva `aria-live="polite"`.

**Elegir la línea (`PickLine`)**
- Grupo de radio (`role="radiogroup"`) donde cada opción es una línea de código completa en tipografía mono. Se mueve con ↑ ↓ y se confirma con el botón Comprobar. No hay que arrastrar nada.

**Ordenar bloques (`OrderBlocks`)**
- Una sola lista vertical, no dos columnas, porque en 375 px dos columnas no caben.
- Cada bloque tiene botones `Subir` y `Bajar` visibles como alternativa al arrastre (R7). El arrastre con `@dnd-kit` es un extra.
- Cada movimiento se anuncia: "Bloque 'try (Connection c = …)' en posición 2 de 6".
- Bloques distractores opcionales en el esquema de la lección, al estilo Runestone (sin verificar).

**Completar huecos (`FillGaps`)**
- Inputs en línea dentro del código, con ancho del tamaño esperado y etiqueta accesible ("Hueco 1: método para crear la sentencia").
- Al comprobar, cada hueco se marca correcto o incorrecto con texto, y en el error se muestra la pista.

**Evitar**
- Monaco en modo editable para estos ejercicios: pesa más de 2 MB y estorba el teclado. Para la v1 basta resaltar con Shiki en el servidor y usar inputs nativos. Monaco queda para fase 2.

### Lo que no cambia
- Las seis etapas, el Continuar y el rótulo real/simulado vienen de la constitución y no se discuten aquí.
- React Bits sigue limitado a la portada (02-design §8).

---

## Implicaciones de implementación

| Componente | Base | Esfuerzo | Tarea |
|---|---|---|---|
| Tokens: escala tipográfica normal y de exposición, colores de estado (correcto, error, simulación, real) | Tailwind 4 `@theme` | Bajo | PA-4 |
| `StageIndicator` (6 etapas) | `<ol>` semántico + `aria-current` | Bajo | PA-6 |
| `LessonPlayer` cabecera, pie y atajos | React + `?step=n` | Medio | PA-6 |
| `CodeTabs` | Patrón APG escrito a mano (unas 60 líneas) | Bajo | PA-7 |
| Resaltado de código | **Shiki** en servidor en lugar de Monaco | Bajo | PA-7 |
| `OrderBlocks` con botones y región viva | Sin dependencia; `@dnd-kit` opcional | Medio | PA-7 |
| Modo exposición y vista general `O` | Contexto + atributo en `<html>` | Medio | PA-8 |

**Decisión aprobada (6 nov 2026):** Shiki más inputs nativos para la v1; Monaco pasa a fase 2. Aplicado en `00-constitution.md`.

## Fuentes y limitaciones

- **No se pudo leer:** la página de Parsons de Runestone devolvió 403. Su formato se conoce solo por resultados de búsqueda y su soporte de teclado no está verificado.
- **Sin información:** no se encontró documentación pública del reproductor de lecciones de Brilliant. No se usa como referencia.
- **No consultados:** Mobbin, Refero y Page Flows requieren cuenta, y Dribbble y Behance no se consultaron dentro del timebox. Las referencias son de producción y de sistemas de diseño, no conceptuales.
- **Datos de páginas leídas como texto:** de DB LAB y Gurwi no se vio el estilo visual ni las capturas, solo la estructura y los textos. El estilo de bloques de código de DB LAB no se pudo observar.
- **DoD parcial en el objetivo 2:** el modo exposición tiene dos referencias verificadas (R1, R6), no tres. Ninguna otra fuente revisada trata la proyección en aula.
- **Valores propios:** las medidas (28 px, 22 px, 68 caracteres, 150 ms) son recomendaciones de este documento, no tomadas de las fuentes. Se validan en el ensayo con proyector (PA-28).
