# PersisteApp · Constitución del proyecto (SDD)

> Fuente: `PersisteApp.md` (5 nov 2026, Daniel David Turizo). Este archivo fija las reglas que ninguna spec, diseño o tarea puede romper. Si una tarea choca con un principio, gana el principio y la tarea se replantea.

## Flujo SDD que se sigue

```
constitution  →  requirements (QUÉ)  →  design (CÓMO)  →  tasks (PASOS)  →  código  →  verificación contra criterios
```

- Cada requisito tiene un ID `REQ-xx` y criterios de aceptación verificables (formato EARS: *Cuando… el sistema debe…*).
- Cada tarea `T-xx` cita los `REQ` que cumple. Una tarea sin `REQ` no se hace en los 3 días.
- Una tarea se cierra solo si cumple su Definition of Done (DoD) y los criterios de sus `REQ`.
- Cambio de alcance = se edita primero `requirements.md`, luego `design.md`, luego `tasks.md`. Nunca al revés.

## Principios no negociables

| # | Principio | Consecuencia práctica |
|---|---|---|
| P1 | **Transparencia real / simulado.** Todo resultado se rotula como `Ejecución real` o `Simulación`. | Componente `ExecutionBadge` obligatorio en cada salida. Revisión explícita el domingo. |
| P2 | **No se ejecuta Java de estudiantes en la v1.** | Prácticas de nivel 1 (código guiado) y nivel 2 (SQL en navegador con PGlite). Sin contenedores. |
| P3 | **Ninguna credencial en el cliente ni en el repositorio.** | Supabase solo con variables de entorno de servidor. `.env*` en `.gitignore`. |
| P4 | **El CRUD sigue las convenciones del docente (GameZoneUnicesar).** | Paquetes `model/persistence/service/ui`, `ProductStore` + `JdbcProductRepository`, inglés en código, español en consola, JavaDoc, Java 17, Maven. |
| P5 | **Contenido como datos.** | Lecciones en JSON tipado; un solo renderizador de pasos. No se construyen pantallas por lección. |
| P6 | **Primero el problema, luego la teoría.** | Cada lección sigue Problema → Visualizar → Predecir → Escribir → Ejecutar → Explicar. |
| P7 | **Accesible en aula.** | Teclado completo, contraste AA, modo oscuro, funciona en celular y en proyector. |
| P8 | **Diseño sin relleno.** | Se respeta la skill `ui-reference-intelligence`: sin dashboards genéricos, sin estadísticas falsas, animación solo si explica algo. |
| P9 | **Alcance de 3 días = sesión 1.** | Sesión 2 y fase 2 viven en el backlog, no en el sprint. |

## Pila fijada

- Next.js (App Router) + React + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Monaco Editor (solo lectura / huecos) para Java y SQL.
- React Bits para portada y animaciones puntuales.
- PGlite (PostgreSQL en WebAssembly) para el laboratorio SQL real, cargado bajo demanda.
- Supabase (PostgreSQL) para la demo del docente con el CRUD Java.
- CRUD Java 17 + Maven + HikariCP + JUnit 5 / AssertJ / Mockito + JaCoCo (≥ 70 % en `service`).

## Calendario fijo

| Fecha | Hito |
|---|---|
| Vie 6 nov 2026 | Día 1 · Base |
| Sáb 7 nov 2026 | Día 2 · Sesión 1 completa |
| Dom 8 nov 2026 | Día 3 · Pulido, despliegue y ensayo — **fecha límite del plazo de 3 días** |
| Lun 9 nov 2026 | Sesión 1 en vivo: 8:00–10:00 y 10:00–12:00 |
| Mié 11 o Jue 12 nov 2026 | Sesión 2 (se construye fuera del plazo, lun tarde y mar) |
