# Prompt para Codex (agente B)

Copia esto en Codex, con la carpeta `C:\projects-p3\PersisteApp` abierta y en la rama `feat/teoria-bd`:

---

Trabajas en PersisteApp (Next.js en `web/`), rama `feat/teoria-bd`. Otro agente (Claude Code) trabaja al mismo tiempo en la misma carpeta.

1. Lee `specs/04-rumbo-teoria-bd.md` completo. Tu parte es **«Agente B · Codex»**, tareas B1 a B8, en ese orden.
2. Lee `web/AGENTS.md` (esta versión de Next.js tiene cambios) y `web/lib/lesson-schema.ts` (formato de lecciones). Lee `web/lib/sample-db.ts` para los datos de ejemplo.
3. Toca **solo** los archivos listados en tu sección. No edites `web/components/db/**`, `web/lib/sample-db.ts`, `web/components/lesson/steps.tsx`, `package.json` ni las lecciones 1–3: son del otro agente.
4. Valida el contenido con `npm run validate:content` dentro de `web/`. Al final, `npm test` y `npm run build` deben pasar.
5. Commits atómicos con Conventional Commits, en español o inglés, sin líneas de atribución, con `git add <tus rutas>` (nunca `git add .` ni `-A`). No hagas push ni merge.
6. Si necesitas algo del contrato que no existe, no lo inventes en archivos del otro agente: anótalo al final de `specs/04-rumbo-teoria-bd.md` en una sección «Pendientes para Claude Code».

Tono del contenido: es una clase de apoyo, no una evaluación. Menos tecnicismo de Java; explica con la tabla `estudiante` y `matricula` del ejemplo.
