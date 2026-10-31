import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runOwnWorkspaceCommand } from '../features/vendors/server/workspace-command';
function fixture() {
    const state = { owner: 'isolated-owner', missing: false, failInsert: false, writes: [] as {
            table: string;
            operation: string;
            values: unknown;
            filters: unknown[];
        }[] };
    const db = { from: (table: string) => {
            let operation = 'select', values: unknown;
            const filters: unknown[] = [];
            const execute = async () => {
                if (operation !== 'select') {
                    state.writes.push({ table, operation, values, filters });
                    if (state.failInsert && operation === 'upsert')
                        return { data: null, error: Error('Insert failed') };
                    return { data: null, error: null };
                }
                if (table === 'vendors')
                    return { data: state.missing ? null : { id: 'own-vendor', slug: 'private-fixture' }, error: null };
                if (table === 'categories')
                    return { data: [{ id: 'photo-id', key: 'photography' }], error: null };
                if (table === 'vendor_categories')
                    return { data: [{ category_id: 'old-id' }], error: null };
                throw Error('Unexpected fixture query');
            };
            const query = { select: () => query, eq: (key: string, value: unknown) => { filters.push([key, value]); if (table === 'vendors' && key === 'owner_id')
                    assert.equal(value, state.owner); return query; }, in: (key: string, value: unknown) => { filters.push([key, value]); return query; }, limit: () => query, update: (data: unknown) => { operation = 'update'; values = data; return query; }, upsert: (data: unknown) => { operation = 'upsert'; values = data; return query; }, delete: () => { operation = 'delete'; return query; }, maybeSingle: execute, then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => execute().then(resolve, reject) };
            return query;
        } } as unknown as SupabaseClient;
    return { state, db };
}
test('native publication derives the vendor from the verified owner and retains RLS filters', async () => {
    const { state, db } = fixture();
    await runOwnWorkspaceCommand(db, state.owner, { action: 'publication', published: true, vendorId: 'someone-else' });
    assert.deepEqual(state.writes, [{ table: 'vendors', operation: 'update', values: { is_published: true }, filters: [['id', 'own-vendor'], ['owner_id', state.owner]] }]);
});
test('an account without its own business cannot mutate a supplied vendor ID', async () => {
    const { state, db } = fixture();
    state.missing = true;
    await assert.rejects(runOwnWorkspaceCommand(db, state.owner, { action: 'publication', published: true, vendorId: 'someone-else' }));
    assert.equal(state.writes.length, 0);
});
test('native locations keep weddings in Costa Rica and validate coordinates', async () => {
    const { state, db } = fixture();
    const values = { address: 'Test location', city: 'San José', state: 'San José', lat: 9.9, lng: -84.1, service_radius_km: 50, country: 'United States' };
    await runOwnWorkspaceCommand(db, state.owner, { action: 'location', values });
    assert.equal((state.writes[0].values as {
        country: string;
    }).country, 'Costa Rica');
    await assert.rejects(runOwnWorkspaceCommand(db, state.owner, { action: 'location', values: { ...values, lat: 100 } }));
    assert.equal(state.writes.length, 1);
});
test('a failed category insertion never deletes the previously saved categories', async () => {
    const { state, db } = fixture();
    state.failInsert = true;
    await assert.rejects(runOwnWorkspaceCommand(db, state.owner, { action: 'categories', keys: ['photography'] }));
    assert.equal(state.writes.length, 1);
    assert.equal(state.writes[0].operation, 'upsert');
});
test('category retries deduplicate selection and remove only obsolete owned links', async () => {
    const { state, db } = fixture();
    await runOwnWorkspaceCommand(db, state.owner, { action: 'categories', keys: ['photography', 'photography'] });
    assert.deepEqual(state.writes[0].values, [{ vendor_id: 'own-vendor', category_id: 'photo-id' }]);
    assert.deepEqual(state.writes[1].filters, [['vendor_id', 'own-vendor'], ['category_id', ['old-id']]]);
});
