export type JobLogger = (message: string) => Promise<number> | Promise<void> | void;

export interface JobTimer {
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
  start(label: string): () => Promise<void>;
  total(): Promise<void>;
}

export function createJobTimer(log: JobLogger): JobTimer {
  const jobStart = Date.now();
  const spans: Array<[label: string, ms: number]> = [];

  const record = async (label: string, ms: number) => {
    spans.push([label, ms]);
    await log(`${label}: ${ms}ms`);
  };

  return {
    async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const t0 = Date.now();
      try {
        return await fn();
      } finally {
        await record(label, Date.now() - t0);
      }
    },
    start(label: string) {
      const t0 = Date.now();
      return () => record(label, Date.now() - t0);
    },
    async total() {
      const totalMs = Date.now() - jobStart;
      const parts = spans.map(([l, ms]) => `${l}=${ms}ms`).join(', ');
      await log(`total: ${(totalMs / 1000).toFixed(2)}s${parts ? ` (${parts})` : ''}`);
    },
  };
}
