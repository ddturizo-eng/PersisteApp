/**
 * Pure model of the app ↔ database mirror (REQ-12, module 5). A tiny in-memory store with the
 * tables `products` and `sales` of the Java CRUD (crud/v1-layered), and the sale of
 * ProductService.registerSale replayed statement by statement, with autocommit or inside a
 * transaction. The simulator only draws these snapshots, so what the lesson claims is tested.
 *
 * Order follows the real code: INSERT the sale first, then UPDATE the stock with
 * `WHERE stock >= ?`. If the UPDATE changes no row (not enough stock) or the connection drops
 * after the INSERT, autocommit leaves the sale saved without its stock; a transaction rolls back.
 */

export type Product = { id: number; name: string; price: number; stock: number };
export type SaleRow = { id: number; productId: number; quantity: number; total: number };

export type DbState = {
  products: Product[];
  sales: SaleRow[];
  /** Next value of the sales id sequence. A rollback does not give the number back, like PostgreSQL. */
  nextSaleId: number;
  /** Units each product had at the start, to detect a sale that never took its stock. */
  initialStock: Record<number, number>;
};

export type SaleMode = "autocommit" | "transaction";

export type SaleRequest = {
  productId: number;
  quantity: number;
  mode: SaleMode;
  /** Simulates the connection dropping right after the INSERT. */
  failAfterInsert?: boolean;
};

export type StepKind = "begin" | "select" | "insert" | "update" | "commit" | "rollback" | "crash";

export type SaleStep = {
  kind: StepKind;
  /** Java line the app runs (as in crud/v1-layered). */
  java: string;
  /** SQL that reaches the database, if any. */
  sql?: string;
  ok: boolean;
  /** What happened, in Spanish, for the student. */
  message: string;
  /** Database after this step, uncommitted changes included. */
  db: DbState;
  /** Rows changed inside the open transaction and not yet committed. */
  pending: { saleIds: number[]; productIds: number[] };
};

export type SaleOutcome = "committed" | "rolled-back" | "half-saved" | "rejected";

export type SaleRun = { steps: SaleStep[]; outcome: SaleOutcome; db: DbState };

export const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: "Teclado mecánico", price: 185000, stock: 12 },
  { id: 3, name: "Monitor 24\"", price: 720000, stock: 5 },
  { id: 4, name: "Memoria USB 64 GB", price: 38000, stock: 2 },
];

export function createDb(products: Product[] = DEMO_PRODUCTS): DbState {
  return {
    products: products.map((p) => ({ ...p })),
    sales: [],
    nextSaleId: 1,
    initialStock: Object.fromEntries(products.map((p) => [p.id, p.stock])),
  };
}

const clone = (db: DbState): DbState => ({
  products: db.products.map((p) => ({ ...p })),
  sales: db.sales.map((s) => ({ ...s })),
  nextSaleId: db.nextSaleId,
  initialStock: { ...db.initialStock },
});

/** Products whose stock does not match their sales: sold units that never left the shelf. */
export function inconsistencies(db: DbState): { productId: number; sold: number; taken: number }[] {
  return db.products
    .map((p) => {
      const sold = db.sales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
      const taken = (db.initialStock[p.id] ?? p.stock) - p.stock;
      return { productId: p.id, sold, taken };
    })
    .filter((row) => row.sold !== row.taken);
}

const money = (n: number) => `$${n.toLocaleString("es-CO")}`;

/** Replays registerSale(productId, quantity) against `start`; never mutates it. */
export function runSale(start: DbState, request: SaleRequest): SaleRun {
  const { productId, quantity, mode, failAfterInsert = false } = request;
  const tx = mode === "transaction";
  const steps: SaleStep[] = [];
  let db = clone(start);
  const pending = { saleIds: [] as number[], productIds: [] as number[] };
  const push = (step: Omit<SaleStep, "db" | "pending">) =>
    steps.push({ ...step, db: clone(db), pending: { saleIds: [...pending.saleIds], productIds: [...pending.productIds] } });

  if (!Number.isInteger(quantity) || quantity <= 0) {
    push({ kind: "select", java: "if (quantity <= 0) throw new IllegalArgumentException(...);", ok: false, message: "La cantidad debe ser mayor que cero: la venta ni siquiera llega a la base." });
    return { steps, outcome: "rejected", db };
  }

  if (tx) {
    push({ kind: "begin", java: "connection.setAutoCommit(false);", ok: true, message: "Empieza la transacción: desde aquí nada se guarda solo." });
  }

  const product = db.products.find((p) => p.id === productId);
  push({
    kind: "select",
    java: "Product product = products.findById(productId)",
    sql: `SELECT id, name, price, stock FROM products WHERE id = ${productId}`,
    ok: Boolean(product),
    message: product ? `Encontró «${product.name}»: hay ${product.stock} y cuesta ${money(product.price)}.` : `No existe un producto con id ${productId}.`,
  });
  if (!product) {
    if (tx) push({ kind: "rollback", java: "connection.rollback();", ok: true, message: "No se había escrito nada: el rollback no tiene qué deshacer." });
    return { steps, outcome: "rejected", db };
  }

  const before = clone(db);
  const sale: SaleRow = { id: db.nextSaleId, productId, quantity, total: product.price * quantity };
  db.nextSaleId += 1;
  db.sales.push(sale);
  if (tx) pending.saleIds.push(sale.id);
  push({
    kind: "insert",
    java: "sales.save(new Sale(null, productId, quantity, total))",
    sql: `INSERT INTO sales (product_id, quantity, total) VALUES (${productId}, ${quantity}, ${sale.total})`,
    ok: true,
    message: tx
      ? `Venta ${sale.id} insertada, pero sin confirmar: solo esta conexión la ve.`
      : `Venta ${sale.id} insertada y confirmada al instante (autocommit).`,
  });

  const fail = (kind: StepKind, step: Omit<SaleStep, "db" | "pending" | "kind">): SaleRun => {
    push({ kind, ...step });
    if (!tx) return { steps, outcome: "half-saved", db };
    db = clone(before);
    db.nextSaleId = sale.id + 1; // the sequence does not go back
    pending.saleIds = [];
    pending.productIds = [];
    push({ kind: "rollback", java: "connection.rollback();", sql: "ROLLBACK", ok: true, message: `Rollback: la venta ${sale.id} desaparece y el stock queda como estaba.` });
    return { steps, outcome: "rolled-back", db };
  };

  if (failAfterInsert) {
    return fail("crash", {
      java: "products.decreaseStock(productId, quantity)",
      ok: false,
      message: "Se cayó la conexión antes del UPDATE: el stock no se descontó.",
    });
  }

  const row = db.products.find((p) => p.id === productId)!;
  const updateSql = `UPDATE products SET stock = stock - ${quantity} WHERE id = ${productId} AND stock >= ${quantity}`;
  if (row.stock < quantity) {
    return fail("update", {
      java: "products.decreaseStock(productId, quantity)  // devuelve false",
      sql: updateSql,
      ok: false,
      message: `0 filas actualizadas: hay ${row.stock} y pediste ${quantity}. Se lanza InsufficientStockException.`,
    });
  }
  row.stock -= quantity;
  if (tx) pending.productIds.push(productId);
  push({
    kind: "update",
    java: "products.decreaseStock(productId, quantity)",
    sql: updateSql,
    ok: true,
    message: tx ? `Stock de ${row.stock + quantity} a ${row.stock}, todavía sin confirmar.` : `Stock de ${row.stock + quantity} a ${row.stock}, confirmado al instante.`,
  });

  if (tx) {
    pending.saleIds = [];
    pending.productIds = [];
    push({ kind: "commit", java: "connection.commit();", sql: "COMMIT", ok: true, message: "Commit: la venta y el stock se guardan juntos y todos los ven." });
  }
  return { steps, outcome: "committed", db };
}
