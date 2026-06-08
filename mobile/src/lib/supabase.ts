import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { mobileConfig } from "./config";

export const supabase =
  mobileConfig.supabaseUrl && mobileConfig.supabaseAnonKey
    ? createClient(mobileConfig.supabaseUrl, mobileConfig.supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
