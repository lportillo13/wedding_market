import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../../lib/supabase';
import { ACCOUNT_NOTIFICATION_TYPES, VENDOR_NOTIFICATION_TYPES } from '../../../../shared/notifications/events';
/** One count-only read on navigation/activity/foreground; no rows or idle timer. */
export function useUnreadCount(userId: string | undefined, vendor: boolean, revision: number, screen: string) {
    const [value, setValue] = useState({ userId: '', count: 0 });
    useEffect(() => {
        if (!userId || !supabase)
            return;
        let active = true, running = false;
        const abort = new AbortController();
        async function refresh() {
            if (!active || running || AppState.currentState !== 'active')
                return;
            running = true;
            try {
                const result = await supabase!.from('notifications').select('id', { head: true, count: 'exact' }).eq('recipient_id', userId!).is('read_at', null).is('deleted_at', null).in('type', vendor ? [...VENDOR_NOTIFICATION_TYPES] : [...ACCOUNT_NOTIFICATION_TYPES]).abortSignal(abort.signal);
                if (active && !result.error)
                    setValue({ userId: userId!, count: result.count ?? 0 });
            }
            catch { /* Keep the last count for this account until a foreground retry. */ }
            finally {
                running = false;
            }
        }
        void refresh();
        const listener = AppState.addEventListener('change', state => { if (state === 'active')
            void refresh(); });
        return () => { active = false; abort.abort(); listener.remove(); };
    }, [userId, vendor, revision, screen]);
    return value.userId === userId ? value.count : 0;
}
