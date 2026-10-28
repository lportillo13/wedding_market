import { mobileConfig } from '../../lib/config';
import { supabase } from '../../lib/supabase';
import { requestJson } from '../../lib/http';
import { withDeadline } from '../../../../shared/resources/deadline';
export async function boutiqueRequest<T>(path: string, body?: unknown): Promise<T> {
    const client = supabase;
    const { data } = client ? await withDeadline(() => client.auth.getSession()) : { data: { session: null } };
    if (!mobileConfig.webApiUrl)
        throw new Error('The service is not configured.');
    return requestJson<T>(`${mobileConfig.webApiUrl}/api/boutiques${path}`, {
        headers: { ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
    });
}
