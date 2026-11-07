/**
 * Pure model of a connection pool (REQ-10, design §4: PoolSimulator). A discrete simulation of a
 * burst of requests, with or without a pool, so the lesson's numbers come from tested code.
 *
 * Without a pool every request pays the connection cost (TCP, protocol, login) and then closes it.
 * With a pool, the connections were opened once when the app started; a request borrows a free
 * one, or waits in line until another request returns one.
 */

export type PoolScenario = {
  /** Connections the pool keeps open (HikariCP maximumPoolSize). Ignored when `pooled` is false. */
  poolSize: number;
  pooled: boolean;
  requests?: number;
  /** Milliseconds between two requests arriving. */
  arrivalEveryMs?: number;
  /** Cost of opening a connection from scratch. */
  connectMs?: number;
  /** Cost of the query itself once connected. */
  queryMs?: number;
};

export type RequestResult = { id: number; arrivesAt: number; waitedMs: number; responseMs: number; connection: number };

export type PoolResult = {
  requests: RequestResult[];
  /** Average time from arrival to answer. */
  meanMs: number;
  maxMs: number;
  /** Connections opened against the database during the burst (pooled: the ones opened at start). */
  connectionsOpened: number;
  /** Most requests waiting in line at the same time. */
  peakQueue: number;
  /** Most connections in use at the same time. */
  peakInUse: number;
};

export const POOL_DEFAULTS = { requests: 50, arrivalEveryMs: 5, connectMs: 80, queryMs: 15 } as const;
export const POOL_SIZE_RANGE = { min: 1, max: 20 } as const;

export function simulatePool(scenario: PoolScenario): PoolResult {
  const { requests: count, arrivalEveryMs, connectMs, queryMs } = { ...POOL_DEFAULTS, ...scenario };
  const size = Math.min(POOL_SIZE_RANGE.max, Math.max(POOL_SIZE_RANGE.min, Math.round(scenario.poolSize)));
  const arrivals = Array.from({ length: count }, (_, i) => i * arrivalEveryMs);

  const results: RequestResult[] = [];
  if (!scenario.pooled) {
    // Each request opens its own connection at once: no line, but always the connection cost.
    arrivals.forEach((arrivesAt, id) =>
      results.push({ id, arrivesAt, waitedMs: 0, responseMs: connectMs + queryMs, connection: id })
    );
  } else {
    // First come, first served on the connection that frees up first.
    const freeAt = Array.from({ length: size }, () => 0);
    arrivals.forEach((arrivesAt, id) => {
      let connection = 0;
      for (let c = 1; c < size; c++) if (freeAt[c] < freeAt[connection]) connection = c;
      const startsAt = Math.max(arrivesAt, freeAt[connection]);
      freeAt[connection] = startsAt + queryMs;
      results.push({ id, arrivesAt, waitedMs: startsAt - arrivesAt, responseMs: startsAt - arrivesAt + queryMs, connection });
    });
  }

  // Peaks from start/end events of each request (waiting, then in use).
  const events: { t: number; queue: number; inUse: number }[] = [];
  for (const r of results) {
    const startsAt = r.arrivesAt + r.waitedMs;
    const endsAt = r.arrivesAt + r.responseMs;
    if (r.waitedMs > 0) events.push({ t: r.arrivesAt, queue: 1, inUse: 0 }, { t: startsAt, queue: -1, inUse: 0 });
    events.push({ t: startsAt, queue: 0, inUse: 1 }, { t: endsAt, queue: 0, inUse: -1 });
  }
  // Ends before starts at the same instant: a returned connection is free for the next request.
  events.sort((a, b) => a.t - b.t || a.inUse + a.queue - (b.inUse + b.queue));
  let queue = 0;
  let inUse = 0;
  let peakQueue = 0;
  let peakInUse = 0;
  for (const e of events) {
    queue += e.queue;
    inUse += e.inUse;
    peakQueue = Math.max(peakQueue, queue);
    peakInUse = Math.max(peakInUse, inUse);
  }

  const total = results.reduce((sum, r) => sum + r.responseMs, 0);
  return {
    requests: results,
    meanMs: Math.round(total / count),
    maxMs: Math.max(...results.map((r) => r.responseMs)),
    connectionsOpened: scenario.pooled ? size : count,
    peakQueue,
    peakInUse,
  };
}
