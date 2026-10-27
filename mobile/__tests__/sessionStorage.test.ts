import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { EncryptedSessionStorage } from '../src/features/auth/sessionStorage';

function setup() {
  const data = new Map<string, string>();
  const keys = new Map<string, string>();
  const store = (map: Map<string, string>) => ({
    getItem: jest.fn(async (key: string) => map.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { map.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { map.delete(key); }),
  });
  const ports = {
    disk: store(data), secrets: store(keys),
    secretName: async (key: string) => createHash('sha256').update(key).digest('hex'),
    generateKey: async () => randomBytes(32).toString('hex'),
    seal: async (value: string, secret: string, context: string) => {
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
      cipher.setAAD(Buffer.from(context));
      const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      return Buffer.concat([iv, encrypted, cipher.getAuthTag()]).toString('base64');
    },
    open: async (value: string, secret: string, context: string) => {
      const bytes = Buffer.from(value, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), bytes.subarray(0, 12));
      decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(bytes.subarray(-16));
      return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8');
    },
  };
  return { storage: new EncryptedSessionStorage(ports), data, keys, ports };
}
describe('encrypted native session persistence', () => {
  test('long Unicode sessions round-trip with only ciphertext on disk and a small device key', async () => {
    const s = setup(), session = JSON.stringify({ refresh_token: 'private-token', name: 'José 🌿', metadata: 'x'.repeat(9000) });
    await s.storage.setItem('project-session', session);
    expect(s.data.get('project-session')).not.toContain('private-token');
    expect([...s.keys.values()][0]).toHaveLength(64);
    expect(await s.storage.getItem('project-session')).toBe(session);
    const first = s.data.get('project-session');
    await s.storage.setItem('project-session', session);
    expect(s.data.get('project-session')).not.toBe(first); // Fresh authenticated nonce.
  });
  test('legacy values migrate before restore and failed key persistence never falls back to plaintext', async () => {
    const s = setup(); s.data.set('session', 'legacy-private-token');
    expect(await s.storage.getItem('session')).toBe('legacy-private-token');
    expect(s.data.get('session')).not.toContain('legacy-private-token');
    const failed = setup(); failed.data.set('session', 'old-private-token');
    failed.ports.secrets.setItem.mockRejectedValueOnce(Error('locked'));
    await expect(failed.storage.getItem('session')).rejects.toThrow('Unable to access saved sign-in');
    expect(failed.data.has('session')).toBe(false);
    await expect(failed.storage.setItem('too-large', 'x'.repeat(65537))).rejects.toThrow();
    expect(failed.data.has('too-large')).toBe(false);
  });
  test('lost keys, altered ciphertext and copied records cannot restore another session', async () => {
    for (const mode of ['missing', 'altered', 'copied']) {
      const s = setup(); await s.storage.setItem('one', 'private-one');
      if (mode === 'missing') s.keys.clear();
      if (mode === 'altered') { const raw = s.data.get('one')!; s.data.set('one', raw.slice(0, -8) + 'invalid!'); }
      if (mode === 'copied') { await s.storage.setItem('two', 'private-two'); s.keys.set(await s.ports.secretName('two'), s.keys.get(await s.ports.secretName('one'))!); s.data.set('two', s.data.get('one')!); }
      expect(await s.storage.getItem(mode === 'copied' ? 'two' : 'one')).toBeNull();
    }
  });
  test('queued refresh/logout cannot leave a late credential behind, and failed disk removal keeps its key for retry', async () => {
    const s = setup(); const saving = s.storage.setItem('session', 'private'); const removing = s.storage.removeItem('session');
    await Promise.all([saving, removing]); expect(s.data.size).toBe(0); expect(s.keys.size).toBe(0);
    await s.storage.setItem('session', 'another'); s.ports.disk.removeItem.mockRejectedValueOnce(Error('disk busy'));
    await expect(s.storage.removeItem('session')).rejects.toThrow(); expect(s.keys.size).toBe(1);
    await s.storage.removeItem('session'); expect(s.keys.size).toBe(0);
  });
});
