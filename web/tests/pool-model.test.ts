import { describe, expect, it } from "vitest";
import { POOL_DEFAULTS, simulatePool } from "@/lib/pool-model";

const { connectMs, queryMs, requests } = POOL_DEFAULTS;

describe("simulatePool (REQ-10)", () => {
  it("without a pool every request pays the connection cost and opens its own connection", () => {
    const r = simulatePool({ pooled: false, poolSize: 4 });
    expect(r.meanMs).toBe(connectMs + queryMs);
    expect(r.connectionsOpened).toBe(requests);
    expect(r.peakQueue).toBe(0);
    expect(r.requests.every((x) => x.waitedMs === 0)).toBe(true);
  });

  it("with a big enough pool nobody waits and only the query cost remains", () => {
    const r = simulatePool({ pooled: true, poolSize: 4 });
    expect(r.meanMs).toBe(queryMs);
    expect(r.peakQueue).toBe(0);
    expect(r.connectionsOpened).toBe(4);
    expect(r.peakInUse).toBeLessThanOrEqual(4);
  });

  it("a pool that is too small makes a line and can be slower than no pool", () => {
    const one = simulatePool({ pooled: true, poolSize: 1 });
    const none = simulatePool({ pooled: false, poolSize: 1 });
    expect(one.peakQueue).toBeGreaterThan(10);
    expect(one.meanMs).toBeGreaterThan(none.meanMs);
    expect(one.maxMs).toBe(requests * queryMs - (requests - 1) * POOL_DEFAULTS.arrivalEveryMs);
  });

  it("never lends more connections than the pool has and serves in arrival order", () => {
    const r = simulatePool({ pooled: true, poolSize: 2 });
    expect(r.peakInUse).toBeLessThanOrEqual(2);
    const starts = r.requests.map((x) => x.arrivesAt + x.waitedMs);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("clamps the pool size to 1–20", () => {
    expect(simulatePool({ pooled: true, poolSize: 0 }).connectionsOpened).toBe(1);
    expect(simulatePool({ pooled: true, poolSize: 99 }).connectionsOpened).toBe(20);
  });
});
