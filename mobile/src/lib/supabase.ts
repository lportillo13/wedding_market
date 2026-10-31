import "react-native-url-polyfill/auto";
import '../features/auth/nativeCrypto';

import { nativeSessionStorage } from "../features/auth/nativeSessionStorage";
import { createClient } from "@supabase/supabase-js";
import { mobileConfig } from "./config";

export const supabase =
  mobileConfig.supabaseUrl && mobileConfig.supabaseAnonKey
    ? createClient(mobileConfig.supabaseUrl, mobileConfig.supabaseAnonKey, {
        auth: {
          storage: nativeSessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      })
    : null;
