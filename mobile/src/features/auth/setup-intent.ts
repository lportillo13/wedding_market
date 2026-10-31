import AsyncStorage from '@react-native-async-storage/async-storage';
const key = 'wm:onboarding-intent:v1';
export async function setSetupIntent(kind: 'client' | 'vendor' | null) {
    if (kind)
        await AsyncStorage.setItem(key, JSON.stringify({ kind, expires: Date.now() + 30 * 60 * 1000 }));
    else
        await AsyncStorage.removeItem(key);
}
export async function getSetupIntent() {
    const raw = await AsyncStorage.getItem(key);
    if (!raw)
        return null;
    try {
        const value = JSON.parse(raw);
        if (value.expires > Date.now() && (value.kind === 'client' || value.kind === 'vendor'))
            return value.kind as 'client' | 'vendor';
    }
    catch { /* Invalid local intent never grants access. */ }
    await AsyncStorage.removeItem(key);
    return null;
}
