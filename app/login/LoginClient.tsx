"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else router.replace(nextPath);
  }

  async function onGoogle() {
    setErr(null);
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        // IMPORTANT: uses the same origin you're on (localhost or 192.168.x.x)
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  }

  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1 className="my-4">Login</h1>

      {err && <div className="alert alert-danger">{err}</div>}

      <form onSubmit={onEmailPassword} className="mb-3">
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <button className="btn btn-outline-secondary w-100" onClick={onGoogle}>
        Continue with Google
      </button>
    </main>
  );
}
