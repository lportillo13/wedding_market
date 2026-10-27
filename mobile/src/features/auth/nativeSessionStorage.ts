import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { EncryptedSessionStorage } from './sessionStorage';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const nativeSessionStorage = Platform.OS === 'web' ? AsyncStorage : new EncryptedSessionStorage({
  disk: AsyncStorage,
  secrets: {
    getItem: key => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
    removeItem: key => SecureStore.deleteItemAsync(key),
  },
  secretName: async key => `wm.auth.${await digestStringAsync(CryptoDigestAlgorithm.SHA256, key)}`,
  generateKey: async () => (await AESEncryptionKey.generate()).encoded('hex'),
  seal: async (value, secret, context) => {
    const key = await AESEncryptionKey.import(secret, 'hex');
    const sealed = await aesEncryptAsync(encoder.encode(value), key, { additionalData: encoder.encode(context) });
    return sealed.combined('base64');
  },
  open: async (value, secret, context) => {
    const key = await AESEncryptionKey.import(secret, 'hex');
    // Android's native fromCombined bridge accepts Uint8Array, not encoded strings.
    const combined = Uint8Array.from(atob(value), char => char.charCodeAt(0));
    const opened = await aesDecryptAsync(AESSealedData.fromCombined(combined), key, { additionalData: encoder.encode(context) });
    return decoder.decode(opened);
  },
});
