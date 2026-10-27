type Store = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
type Ports = {
  disk: Store;
  secrets: Store;
  secretName(key: string): Promise<string>;
  generateKey(): Promise<string>;
  seal(value: string, secret: string, context: string): Promise<string>;
  open(value: string, secret: string, context: string): Promise<string>;
};
const prefix = 'wm.encrypted-session.v1:';
const maxValue = 64 * 1024;

/** AES-GCM ciphertext on disk; only a small device-only key goes into SecureStore. */
export class EncryptedSessionStorage implements Store {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private ports: Ports) {}

  private run<T>(work: () => Promise<T>): Promise<T> {
    const pending = this.queue.then(work, work).catch(() => {
      throw new Error('Unable to access saved sign-in. Unlock your device and try again.');
    });
    this.queue = pending.catch(() => {});
    return pending;
  }

  private async purge(key: string, secretName: string) {
    // Keep the key if ciphertext removal fails, so a retry can still recover it.
    await this.ports.disk.removeItem(key);
    await this.ports.secrets.removeItem(secretName);
  }

  private async write(key: string, value: string, secretName: string) {
    if (value.length > maxValue) throw new Error('Saved sign-in exceeds the storage limit.');
    let secret = await this.ports.secrets.getItem(secretName);
    if (!secret) {
      secret = await this.ports.generateKey();
      if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Invalid generated encryption key.');
      await this.ports.secrets.setItem(secretName, secret);
      if (await this.ports.secrets.getItem(secretName) !== secret) throw new Error('Encryption key was not saved.');
    }
    if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Invalid saved encryption key.');
    const sealed = await this.ports.seal(value, secret, key);
    if (!sealed || sealed.length > maxValue * 6) throw new Error('Invalid encrypted sign-in.');
    await this.ports.disk.setItem(key, prefix + sealed);
  }

  getItem(key: string): Promise<string | null> {
    return this.run(async () => {
      const value = await this.ports.disk.getItem(key);
      if (value === null) return null;
      const secretName = await this.ports.secretName(key);
      if (value.startsWith(prefix)) {
        const secret = await this.ports.secrets.getItem(secretName);
        if (!secret || !/^[a-f0-9]{64}$/i.test(secret) || value.length > maxValue * 6 + prefix.length) {
          await this.purge(key, secretName);
          return null;
        }
        try {
          const opened = await this.ports.open(value.slice(prefix.length), secret, key);
          if (opened.length > maxValue) throw new Error('Invalid decrypted sign-in.');
          return opened;
        } catch {
          await this.purge(key, secretName);
          return null;
        }
      }
      // Upgrade existing installs before allowing a legacy session to be restored.
      try {
        await this.write(key, value, secretName);
        return value;
      } catch (error) {
        await this.ports.disk.removeItem(key);
        throw error;
      }
    });
  }

  setItem(key: string, value: string): Promise<void> {
    return this.run(async () => this.write(key, value, await this.ports.secretName(key)));
  }

  removeItem(key: string): Promise<void> {
    return this.run(async () => this.purge(key, await this.ports.secretName(key)));
  }
}
