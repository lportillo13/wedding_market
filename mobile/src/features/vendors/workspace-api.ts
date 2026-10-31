import { supabase } from '../../lib/supabase';
import { mobileConfig } from '../../lib/config';
import { requestJson } from '../../lib/http';
export async function workspaceCommand(input: unknown) {
    const { data } = await supabase!.auth.getSession();
    if (!data.session?.access_token)
        throw Error('Sign in required.');
    await requestJson(mobileConfig.webApiUrl + '/api/mobile/vendor-workspace', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token }, body: JSON.stringify(input) });
}
