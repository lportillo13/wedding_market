export async function boutiqueApi<T>(path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(`/api/boutiques${path}`, { cache: 'no-store', signal: controller.signal, ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || 'Unable to complete this action.');
        return data as T;
    }
    finally {
        clearTimeout(timer);
    }
}
