import { Platform } from "react-native";
import Constants from "expo-constants";
import { mobileConfig } from "./config";
import { supabase } from "./supabase";
import { requestJson } from "./http";

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

function expoProjectId() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return typeof projectId === "string" && projectId.trim() ? projectId.trim() : null;
}

async function getExpoPushToken(Notifications: NotificationsModule) {
  const projectId = expoProjectId();
  if (!projectId) {
    throw new Error("EAS project ID is not configured.");
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
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

  let token: string;
  try {
    token = await getExpoPushToken(Notifications);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unable to create a push token." };
  }
  try {
    const payload = await requestJson<{ ok?: boolean; message?: string }>(`${mobileConfig.webApiUrl}/api/mobile/push-token`, {
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
    if (!payload.ok) return { ok: false, reason: payload.message ?? "Unable to register push token." };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unable to register push token." };
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

  let token: string;
  try {
    token = await getExpoPushToken(Notifications);
  } catch {
    return;
  }
  await requestJson(`${mobileConfig.webApiUrl}/api/mobile/push-token`, {
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

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || isRemoved) return;
      onOpenInbox();
      Notifications.clearLastNotificationResponse();
    });

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
