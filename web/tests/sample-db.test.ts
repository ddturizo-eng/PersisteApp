import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { splitStatements } from "@/components/db/sql-lab";
import { createTableSql, presetQueries, seedSql, tables } from "@/lib/sample-db";

describe("sample database (REQ-42)", () => {
  it("creates the tables with their keys", () => {
    expect(createTableSql("matricula")).toContain("estudiante_id INTEGER NOT NULL REFERENCES estudiante(id)");
    expect(createTableSql("curso")).toContain("id SERIAL PRIMARY KEY");
  });

  it("every foreign key in the seed points to an existing row", () => {
    const ids = (name: "estudiante" | "curso") => new Set(tables[name].rows.map((r) => r.id));
    for (const m of tables.matricula.rows) {
      expect(ids("estudiante").has(m.estudiante_id)).toBe(true);
      expect(ids("curso").has(m.curso_id)).toBe(true);
    }
  });

  it("splits a script into statements", () => {
    expect(splitStatements("BEGIN;\nDELETE FROM matricula;\nROLLBACK;")).toEqual(["BEGIN", "DELETE FROM matricula", "ROLLBACK"]);
  });

  it("runs every prepared query on real PostgreSQL; only the FK demos fail", async () => {
    const db = await PGlite.create();
    await db.exec(seedSql());
    const failed: string[] = [];
    for (const q of presetQueries) {
      try {
        for (const s of splitStatements(q.sql)) await db.query(s);
      } catch {
        failed.push(q.id);
        await db.query("ROLLBACK").catch(() => {});
      }
    }
    expect(failed.sort()).toEqual(["delete-fk", "insert-fk"]);
    await db.close();
  }, 30_000);
});
