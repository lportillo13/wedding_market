type CacheOptions = { ttlMs: number; maxEntries: number; maxBytes: number; maxPending: number; now?: () => number };

/** Process-local cache for public JSON only. Never put sessions or RLS results here. */
export class PublicJsonCache<T> {
  private readonly entries = new Map<string, { json: string; bytes: number; expires: number }>();
  private readonly pending = new Map<string, Promise<string>>();
  private bytes = 0;
  private activeLoads = 0;
  private generation = 0;
  private readonly now: () => number;

  constructor(private readonly options: CacheOptions) { this.now = options.now ?? Date.now; }

  clear() {
    this.generation++;
    this.entries.clear(); this.pending.clear(); this.bytes = 0;
  }

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const now = this.now();
    for (const [name, entry] of this.entries) {
      if (entry.expires <= now) { this.entries.delete(name); this.bytes -= entry.bytes; }
    }
    const cached = this.entries.get(key);
    if (cached) {
      this.entries.delete(key); this.entries.set(key, cached);
      return JSON.parse(cached.json) as T;
    }
    let work = this.pending.get(key);
    if (!work) {
      if (this.activeLoads >= this.options.maxPending) throw new Error('The public directory is busy. Please try again shortly.');
      this.activeLoads++;
      const generation = this.generation;
      work = Promise.resolve().then(load).then(value => {
        const json = JSON.stringify(value);
        // UTF-16 storage plus the key; bounded independently of response wire encoding.
        const bytes = (json.length + key.length) * 2;
        if (generation === this.generation && bytes <= this.options.maxBytes) {
          while (this.entries.size && (this.entries.size >= this.options.maxEntries || this.bytes + bytes > this.options.maxBytes)) {
            const oldest = this.entries.keys().next().value!;
            this.bytes -= this.entries.get(oldest)!.bytes; this.entries.delete(oldest);
          }
          this.entries.set(key, { json, bytes, expires: this.now() + this.options.ttlMs }); this.bytes += bytes;
        }
        return json;
      }).finally(() => {
        this.activeLoads--;
        if (this.pending.get(key) === work) this.pending.delete(key);
      });
      this.pending.set(key, work);
    }
    // Every reader gets a copy, including readers of the same in-flight request.
    return JSON.parse(await work) as T;
  }
}
