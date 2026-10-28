import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { ExampleBoutiqueSession } from '../shared/boutiques/example-session';
import { exampleBoutiques } from '../shared/boutiques/examples';
import type { Boutique, BoutiqueAppointment, Outfit } from '../shared/boutiques/types';
const command = (s: ExampleBoutiqueSession, body: unknown) => s.api<{
    data: string;
}>('/account', body);
function request(s: ExampleBoutiqueSession, submission = 'request-1', start = new Date(Date.now() + 86400000).toISOString()) {
    const shop = s.shops[0];
    return { action: 'request', vendor: shop.vendor_id, submission, data: { starts_at: start, wedding_date: '', companions: 1, size_note: 'US 10', budget: '1500 USD', note: 'A fitting please', items: [shop.items[0].id], accepted: true, policies_version: shop.updated_at } };
}
test('fictional catalog has dresses, suits and self-contained media for web/native', async () => {
    const shops = exampleBoutiques('https://thewedmarket.com/');
    assert.equal(shops.length, 3);
    assert.equal(shops.flatMap(s => s.items).length, 18);
    assert.equal(new Set(shops.flatMap(s => s.items.map(i => i.kind))).size, 2);
    assert.ok(shops.every(s => s.slug.startsWith('example-')));
    assert.ok(shops.every(s => s.hero?.startsWith('https://thewedmarket.com/boutique-examples/')));
    assert.ok(shops.every(s => s.items.length === 6));
    for (const item of shops.flatMap(s => s.items)) {
        assert.ok(item.media.length <= 6);
        for (const url of [...item.images, ...item.videos])
            assert.ok(existsSync('public' + new URL(url).pathname), url);
    }
    for (const item of [shops[0].items[0], shops[1].items[0], shops[1].items[1], shops[2].items[0]]) {
        assert.equal(item.images.length, 3);
        assert.equal(new Set(item.images).size, 3);
        assert.equal(item.videos.length, 1);
        assert.equal(item.media.length, 4);
    }
    const s = new ExampleBoutiqueSession();
    const r = await s.api<Boutique>('?slug=example-atelier-alba&kind=suit');
    assert.equal(r.items.length, 2);
    assert.ok(r.items.every(i => i.kind === 'suit'));
    r.items[0].name.en = 'Mutated response';
    assert.notEqual(s.shops[0].items[1].name.en, 'Mutated response');
});
test('favorites persist in one preview, deep-link to stores, and reset in a new session', async () => {
    const s = new ExampleBoutiqueSession(), id = s.shops[1].items[0].id;
    await command(s, { action: 'favorite', id, saved: true });
    await command(s, { action: 'favorite', id, saved: true });
    const r = await s.api<{
        items: (Outfit & {
            slug: string;
        })[];
    }>('/account?mode=favorites');
    assert.equal(r.items.length, 1);
    assert.equal(r.items[0].slug, 'example-casa-marfil');
    assert.equal(new ExampleBoutiqueSession().saved.length, 0);
    await command(s, { action: 'favorite', id, saved: false });
    assert.equal(s.saved.length, 0);
});
test('couple requests, store confirms, each sees replies; retry and immutable snapshots survive edits', async () => {
    const s = new ExampleBoutiqueSession(), c = request(s);
    const { data: id } = await command(s, c);
    assert.equal((await command(s, c)).data, id);
    assert.equal(s.requests.length, 1);
    await assert.rejects(command(s, { ...c, data: { ...c.data, note: 'replace' } }), /retry/);
    await assert.rejects(command(s, { action: 'decide', id, status: 'confirmed', version: 1 }), /boutique preview/);
    await assert.rejects(s.api('/account?mode=workspace'), /boutique preview/);
    s.setRole('store');
    s.setStore(s.shops[1].vendor_id);
    assert.equal((await s.api<{
        items: BoutiqueAppointment[];
    }>('/account?mode=appointments')).items.length, 0);
    await assert.rejects(command(s, { action: 'decide', id, status: 'confirmed', version: 1 }), /unavailable/);
    s.setStore(s.shops[0].vendor_id);
    await command(s, { action: 'decide', id, status: 'confirmed', version: 1, note: 'See you soon' });
    assert.equal(s.requests[0].status, 'confirmed');
    assert.equal(s.requests[0].version, 2);
    const oldPolicy = s.requests[0].policies_snapshot.policies.en;
    const shop = s.shops[0];
    await command(s, { action: 'settings', vendor: shop.vendor_id, data: { enabled: true, duration_minutes: 45, companions_max: 2, visit_fee_cents: 0, currency: 'USD', policies: { en: 'Changed policy', es: 'Cambio' } } });
    assert.equal(s.requests[0].policies_snapshot.policies.en, oldPolicy);
    const reply = { action: 'reply', id, submission: 'reply-1', body: 'Your fitting is confirmed' };
    await command(s, reply);
    await command(s, reply);
    assert.equal(s.requests[0].messages?.length, 1);
    await assert.rejects(command(s, { ...reply, body: 'replacement' }), /retry/);
    s.setRole('couple');
    await command(s, { ...reply, submission: 'reply-2', body: 'Thank you' });
    const inbox = await s.api<{
        items: BoutiqueAppointment[];
    }>('/account?mode=appointments');
    assert.equal(inbox.items[0].messages?.length, 2);
    await command(s, { action: 'decide', id, status: 'cancelled', version: 2 });
    assert.equal(s.requests[0].status, 'cancelled');
});
test('overlapping requests remain pending until a store chooses; stale decisions and cross-store edits fail', async () => {
    const s = new ExampleBoutiqueSession(), c = request(s);
    const a = await command(s, c), b = await command(s, { ...c, submission: 'request-2' });
    s.setRole('store');
    await command(s, { action: 'decide', id: a.data, status: 'confirmed', version: 1 });
    await assert.rejects(command(s, { action: 'decide', id: b.data, status: 'confirmed', version: 1 }), /already confirmed/);
    await assert.rejects(command(s, { action: 'decide', id: a.data, status: 'cancelled', version: 1 }), /changed/);
    await command(s, { action: 'decide', id: b.data, status: 'declined', version: 1 });
    assert.equal(s.requests.find(r => r.id === b.data)?.status, 'declined');
    await assert.rejects(command(s, { action: 'settings', vendor: s.shops[1].vendor_id, data: {} }), /Choose this boutique/);
});
test('collection edits and publication use a stable media library and preserve prior visit selections', async () => {
    const s = new ExampleBoutiqueSession(), c = request(s);
    await command(s, c);
    s.setRole('store');
    const shop = s.shops[0], item = shop.items[0], originalName = item.name.en;
    const before = await s.api<{
        vendor: {
            gallery_images: {
                type: string;
            }[];
        };
    }>('/account?mode=workspace');
    const selection = [0, before.vendor.gallery_images.findIndex(m => m.type === 'video')];
    await command(s, { action: 'item', vendor: shop.vendor_id, id: item.id, data: { ...item, name: { en: 'Edited gown', es: 'Vestido editado' }, media_indexes: selection, is_published: false } });
    assert.equal(s.requests[0].items_snapshot[0].name.en, originalName);
    assert.equal((await s.api<Boutique>('?slug=' + shop.slug)).items.length, 5);
    const workspace = await s.api<{
        vendor: {
            gallery_images: unknown[];
        };
    }>('/account?mode=workspace');
    assert.equal(workspace.vendor.gallery_images.length, before.vendor.gallery_images.length);
    await command(s, { action: 'item', vendor: shop.vendor_id, id: item.id, data: { ...item, media_indexes: selection, is_published: true } });
    assert.equal(item.videos.length, 1);
    await command(s, { action: 'settings', vendor: shop.vendor_id, data: { enabled: false, duration_minutes: 60, companions_max: 2, visit_fee_cents: 0, currency: 'USD', policies: shop.policies } });
    assert.equal((await s.api<{
        items: Boutique[];
    }>('?')).items.length, 2);
    s.setRole('couple');
    await assert.rejects(command(s, { ...request(s), submission: 'disabled' }), /Check your preferred/);
});
