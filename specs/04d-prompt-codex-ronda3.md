# Prompt para Codex · ronda 3

---

Sigues en PersisteApp, rama `feat/teoria-bd`. Lee la sección **8 «Ronda 3»** de `specs/04-rumbo-teoria-bd.md` (y las reglas de la sección 7).

Tu parte (fila «Codex»):
1. `web/content/s1/s1-m4-el-viaje.json`: reescribe el paso `trace`. Ida y vuelta completa (Java prepara el SELECT → driver lo traduce → red lo lleva → motor busca filas → red las trae → driver arma el ResultSet → Java lee cada fila). En cada evento: `description` explícita con el dato concreto (ej.: «Java tiene el texto `SELECT nombre FROM estudiante` y llama a `executeQuery()`»), `code` con lo que existe o viaja en ese momento, y `explanation` de qué hace esa pieza. Nada de frases que obliguen a adivinar.
2. Módulos 4–6: todo paso `text` sin `image` va seguido de un visual que lo muestre, o se convierte en visual.
3. Módulo 5: agrega «Nombres que coinciden»: sin ORM, nombres estándar entre tabla y clase (`estudiante` → `Estudiante`, `curso_id` → `cursoId`) y por qué evita errores en `rs.getString("nombre")`. Usa `code-explain`.
4. `npm run validate:content`, `npm test` y `npm run build` en verde. Commits con `git add <tus rutas>`, sin push.

No toques: `web/components/**`, `web/app/**`, lecciones 1–3.
