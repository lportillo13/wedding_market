const fs = require('node:fs');
const path = require('node:path');

const firebaseProject = 'the-wedding-market-a627b';
const androidPackage = 'com.theweddingmarket.app';

// EAS supplies the public Android client file separately from the source archive.
// The private FCM service-account key belongs only in EAS credentials.
module.exports = ({ config }) => {
  const file = process.env.WM_ANDROID_GOOGLE_SERVICES_FILE;
  const remoteAndroid = process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PLATFORM === 'android';
  if (remoteAndroid && !file) throw new Error('Configure WM_ANDROID_GOOGLE_SERVICES_FILE before building Android notifications.');
  if (file) {
    const resolved = path.resolve(file);
    const raw = fs.readFileSync(resolved, 'utf8');
    const client = JSON.parse(raw);
    if (raw.includes('private_key') || client.project_info?.project_id !== firebaseProject ||
        !client.client?.some(item => item.client_info?.android_client_info?.package_name === androidPackage)) {
      throw new Error('The Android client file must belong to Wedding Market and must not contain a private key.');
    }
    config.android = { ...config.android, googleServicesFile: resolved };
  }
  if (process.env.EAS_BUILD === 'true') {
    if (process.env.EXPO_PUBLIC_WEB_API_URL !== 'https://thewedmarket.com' ||
        process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://aousexbvujjnvbudpsmz.supabase.co') {
      throw new Error('Configure the verified Wedding Market web and Supabase URLs before starting a cloud build.');
    }
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    let publicKey = key.startsWith('sb_publishable_');
    if (!publicKey) {
      try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role === 'anon'; } catch { /* Invalid key. */ }
    }
    if (!publicKey) throw new Error('The native app requires the public Supabase key.');
  }
  return config;
};
