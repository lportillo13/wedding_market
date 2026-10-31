type CryptoHost = {
  crypto?: {
    getRandomValues?: (array: Uint32Array) => Uint32Array;
    randomUUID?: () => string;
    subtle?: { digest?: (algorithm: string | {name: string}, data: ArrayBuffer | ArrayBufferView) => Promise<ArrayBuffer> };
  };
};

/** Fill only the native primitives Supabase's PKCE implementation needs.
 * Existing browser/full WebCrypto implementations retain their original methods.
 */
export function installPkceCrypto(host: CryptoHost, native: {
  getRandomValues: (array: Uint32Array) => Uint32Array;
  randomUUID: () => string;
  sha256: (data: ArrayBuffer | ArrayBufferView) => Promise<ArrayBuffer>;
}) {
  const crypto = host.crypto ?? {};
  if (!host.crypto) Object.defineProperty(host, 'crypto', {value: crypto, configurable: true});
  crypto.getRandomValues ??= native.getRandomValues;
  crypto.randomUUID ??= native.randomUUID;
  const subtle = crypto.subtle ?? {};
  if (!subtle.digest) subtle.digest = (algorithm, data) => {
    const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
    if (name.toUpperCase() !== 'SHA-256') return Promise.reject(new Error('Unsupported native authentication digest.'));
    return native.sha256(data);
  };
  if (!crypto.subtle) Object.defineProperty(crypto, 'subtle', {value: subtle, configurable: true});
  return crypto;
}
