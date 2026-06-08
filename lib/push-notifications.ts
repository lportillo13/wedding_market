import type { SupabaseClient } from "@supabase/supabase-js";

type PushTokenRow = {
  token: string;
};

export type PushNotificationPayload = {
  notificationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
};

function isExpoPushToken(token: string) {
  return /^Expo(nent)?PushToken\[[\w-]+\]$/.test(token);
}

function isMissingPushTokenTableError(message: string | undefined) {
  return /user_push_tokens|schema cache|does not exist/i.test(message ?? "");
}

export async function sendMobilePushNotification(
  client: SupabaseClient,
  payload: PushNotificationPayload
) {
  const { data: rows, error } = await client
    .from("user_push_tokens")
    .select("token")
    .eq("user_id", payload.recipientId)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false })
    .limit(10)
    .returns<PushTokenRow[]>();

  if (error) {
    if (!isMissingPushTokenTableError(error.message)) {
      console.warn("Failed to load push tokens", error.message);
    }
    return;
  }

  const tokens = [...new Set((rows ?? []).map((row) => row.token).filter(isExpoPushToken))];
  if (!tokens.length) {
    return;
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body ?? undefined,
    data: {
      notificationId: payload.notificationId,
      type: payload.type,
      payload: payload.data,
    },
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.warn("Expo push request failed", response.status, await response.text());
    }
  } catch (error) {
    console.warn("Expo push request failed", error instanceof Error ? error.message : String(error));
  }
}
