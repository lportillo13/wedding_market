import * as Crypto from 'expo-crypto';
import {Platform} from 'react-native';
import {installPkceCrypto} from './pkceCrypto';

// Hermes provides TextEncoder; Expo supplies the device CSPRNG and SHA-256.
// This prevents the auth SDK's native Math.random/plain-challenge fallbacks.
if (Platform.OS !== 'web') {
  installPkceCrypto(globalThis as unknown as Parameters<typeof installPkceCrypto>[0], {
    getRandomValues: array => Crypto.getRandomValues(array),
    randomUUID: () => Crypto.randomUUID(),
    sha256: data => Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data as BufferSource),
  });
}
