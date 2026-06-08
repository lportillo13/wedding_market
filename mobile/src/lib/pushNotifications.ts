import { Platform } from "react-native";
import Constants from "expo-constants";
import { mobileConfig } from "./config";
import { supabase } from "./supabase";

type NotificationsModule = typeof import("expo-notifications");
type NotificationSubscription = { remove: () => void };

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

function isRunningInExpoGo() {
  return Constants.appOwnership === "expo";
}

async function getNotificationsModule() {
  if (isRunningInExpoGo()) {
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications").then((module) => {
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return module;
  });

  return notificationsModulePromise;
}

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

function allowsNotifications(value: unknown) {
  const permission = value as { granted?: boolean; status?: string; ios?: { status?: number } };
  return permission.granted === true || permission.status === "granted" || permission.ios?.status === 3;
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return { ok: false, reason: "Push notifications require a development build or production app." };
  }

  if (!supabase) {
    return { ok: false, reason: "Supabase is not configured." };
  }

  if (!mobileConfig.webApiUrl) {
    return { ok: false, reason: "EXPO_PUBLIC_WEB_API_URL is not configured." };
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  const finalPermissions = allowsNotifications(existingPermissions)
    ? existingPermissions
    : await Notifications.requestPermissionsAsync();

  if (!allowsNotifications(finalPermissions)) {
    return { ok: false, reason: "Notification permission was not granted." };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Quotes and messages",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1D7A72",
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { ok: false, reason: "Sign in required." };
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const response = await fetch(`${mobileConfig.webApiUrl}/api/mobile/push-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web" ? Platform.OS : "unknown",
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return { ok: false, reason: payload?.message ?? "Unable to register push token." };
  }

  return { ok: true, token };
}

export async function unregisterPushNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  if (!supabase || !mobileConfig.webApiUrl) {
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!allowsNotifications(permissions)) {
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await fetch(`${mobileConfig.webApiUrl}/api/mobile/push-token`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}

export function addNotificationTapListener(onOpenInbox: () => void) {
  let subscription: NotificationSubscription | null = null;
  let isRemoved = false;

  void getNotificationsModule().then((Notifications) => {
    if (!Notifications || isRemoved) {
      return;
    }

    subscription = Notifications.addNotificationResponseReceivedListener(() => {
      onOpenInbox();
    });

    if (isRemoved) {
      subscription.remove();
      subscription = null;
    }
  });

  return {
    remove: () => {
      isRemoved = true;
      subscription?.remove();
      subscription = null;
    },
  };
}
