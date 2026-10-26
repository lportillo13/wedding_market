/** Coalesces foreground wakeups and prevents overlapping refreshes. No timers or IO. */
export class RefreshGate {
  private running = false;
  private lastStarted = -Infinity;
  constructor(private readonly cooldownMs = 5_000) {}
  begin(now: number) {
    if (this.running || now - this.lastStarted < this.cooldownMs) return false;
    this.running = true; this.lastStarted = now; return true;
  }
  finish() { this.running = false; }
}

export const INBOX_LIST_REFRESH_MS = 60_000;
export const INBOX_THREAD_REFRESH_MS = 30_000;
