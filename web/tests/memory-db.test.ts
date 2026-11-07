import { describe, expect, it } from "vitest";
import { createDb, inconsistencies, runSale } from "@/lib/memory-db";

const USB = 4; // stock 2, price 38 000

describe("memory-db: registerSale replayed (REQ-12)", () => {
  it("sells with enough stock the same way in both modes", () => {
    for (const mode of ["autocommit", "transaction"] as const) {
      const run = runSale(createDb(), { productId: USB, quantity: 2, mode });
      expect(run.outcome).toBe("committed");
      expect(run.db.sales).toEqual([{ id: 1, productId: USB, quantity: 2, total: 76000 }]);
      expect(run.db.products.find((p) => p.id === USB)?.stock).toBe(0);
      expect(inconsistencies(run.db)).toEqual([]);
    }
  });

  it("autocommit leaves the sale saved when the stock is short", () => {
    const run = runSale(createDb(), { productId: USB, quantity: 3, mode: "autocommit" });
    expect(run.outcome).toBe("half-saved");
    expect(run.steps.map((s) => s.kind)).toEqual(["select", "insert", "update"]);
    expect(run.db.sales).toHaveLength(1);
    expect(run.db.products.find((p) => p.id === USB)?.stock).toBe(2);
    expect(inconsistencies(run.db)).toEqual([{ productId: USB, sold: 3, taken: 0 }]);
  });

  it("a transaction rolls the sale back when the stock is short", () => {
    const run = runSale(createDb(), { productId: USB, quantity: 3, mode: "transaction" });
    expect(run.outcome).toBe("rolled-back");
    expect(run.steps.map((s) => s.kind)).toEqual(["begin", "select", "insert", "update", "rollback"]);
    expect(run.db.sales).toEqual([]);
    expect(inconsistencies(run.db)).toEqual([]);
    // The sequence number was spent, as in PostgreSQL
    expect(run.db.nextSaleId).toBe(2);
  });

  it("marks inserted rows as pending until commit", () => {
    const run = runSale(createDb(), { productId: USB, quantity: 1, mode: "transaction" });
    const insert = run.steps.find((s) => s.kind === "insert")!;
    const update = run.steps.find((s) => s.kind === "update")!;
    const commit = run.steps.find((s) => s.kind === "commit")!;
    expect(insert.pending).toEqual({ saleIds: [1], productIds: [] });
    expect(update.pending).toEqual({ saleIds: [1], productIds: [USB] });
    expect(commit.pending).toEqual({ saleIds: [], productIds: [] });
  });

  it("a crash after the INSERT: half saved with autocommit, rolled back in a transaction", () => {
    const auto = runSale(createDb(), { productId: 1, quantity: 1, mode: "autocommit", failAfterInsert: true });
    expect(auto.outcome).toBe("half-saved");
    expect(inconsistencies(auto.db)).toHaveLength(1);

    const tx = runSale(createDb(), { productId: 1, quantity: 1, mode: "transaction", failAfterInsert: true });
    expect(tx.outcome).toBe("rolled-back");
    expect(tx.steps.at(-2)?.kind).toBe("crash");
    expect(tx.db.sales).toEqual([]);
  });

  it("rejects bad input before touching the database", () => {
    const start = createDb();
    expect(runSale(start, { productId: USB, quantity: 0, mode: "transaction" }).outcome).toBe("rejected");
    const missing = runSale(start, { productId: 99, quantity: 1, mode: "transaction" });
    expect(missing.outcome).toBe("rejected");
    expect(missing.db).toEqual(start);
  });

  it("never mutates the starting state and accumulates across sales", () => {
    const start = createDb();
    const first = runSale(start, { productId: 1, quantity: 2, mode: "transaction" });
    const second = runSale(first.db, { productId: 1, quantity: 1, mode: "autocommit" });
    expect(start.sales).toEqual([]);
    expect(second.db.sales.map((s) => s.id)).toEqual([1, 2]);
    expect(second.db.products.find((p) => p.id === 1)?.stock).toBe(9);
  });
});
