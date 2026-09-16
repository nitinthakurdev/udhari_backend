import { config } from "@/config/envConfig";
import { pushTokenModel } from "@/models/pushTokenModel";
import type { IRegisterPushTokenPayload, IPushTokenModel } from "@/types/pushNotificationTypes";
import { Op } from "sequelize";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const RECEIPT_DELAY_MS = 15 * 60 * 1000;

export interface PushNotificationInput {
  title: string;
  message: string;
  data?: Record<string, string | number | boolean | null>;
  type: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

const chunks = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const expoHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(config.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${config.EXPO_ACCESS_TOKEN}` } : {}),
});

export const registerPushToken = async (
  userId: number,
  payload: IRegisterPushTokenPayload,
): Promise<IPushTokenModel> => {
  const [token] = await pushTokenModel.findOrCreate({
    where: { expo_push_token: payload.expo_push_token },
    defaults: { ...payload, user_id: userId },
  });

  if (
    token.user_id !== userId ||
    token.platform !== payload.platform ||
    token.device_name !== (payload.device_name ?? null)
  ) {
    await token.update({
      user_id: userId,
      platform: payload.platform,
      device_name: payload.device_name ?? null,
    });
  }

  return token;
};

export const unregisterPushToken = async (userId: number, expoPushToken: string): Promise<void> => {
  await pushTokenModel.destroy({
    where: { user_id: userId, expo_push_token: expoPushToken },
  });
};

const deleteInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  await pushTokenModel.destroy({
    where: { expo_push_token: { [Op.in]: [...new Set(tokens)] } },
  });
};

const checkReceipts = async (tickets: { id: string; token: string }[]): Promise<void> => {
  const invalidTokens: string[] = [];

  for (const batch of chunks(tickets, 1000)) {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers: expoHeaders(),
      body: JSON.stringify({ ids: batch.map(({ id }) => id) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Expo receipt request failed with ${String(response.status)}`);
    }

    const body = (await response.json()) as {
      data?: Record<string, ExpoPushReceipt>;
    };
    batch.forEach(({ id, token }) => {
      const receipt = body.data?.[id];
      if (receipt?.details?.error === "DeviceNotRegistered") invalidTokens.push(token);
      if (receipt?.status === "error") {
        console.error("Expo push receipt error", receipt.message ?? receipt.details?.error);
      }
    });
  }

  await deleteInvalidTokens(invalidTokens);
};

export const sendPushNotifications = async (
  userIds: number[],
  notification: PushNotificationInput,
): Promise<void> => {
  if (userIds.length === 0) return;

  const tokenRows = await pushTokenModel.findAll({
    where: { user_id: { [Op.in]: userIds } },
    attributes: ["expo_push_token"],
  });
  const tokens = [...new Set(tokenRows.map(({ expo_push_token: token }) => token))];
  if (tokens.length === 0) return;

  const receiptTickets: { id: string; token: string }[] = [];
  const invalidTokens: string[] = [];

  for (const tokenBatch of chunks(tokens, 100)) {
    const messages = tokenBatch.map((token) => ({
      to: token,
      title: notification.title,
      body: notification.message,
      sound: "default",
      channelId: "udhari-updates",
      priority: "high",
      data: { ...notification.data, type: notification.type },
    }));
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: expoHeaders(),
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Expo push request failed with ${String(response.status)}`);
    }

    const body = (await response.json()) as { data?: ExpoPushTicket[] };
    (body.data ?? []).forEach((ticket, index) => {
      const token = tokenBatch[index];
      if (!token) return;
      if (ticket.status === "ok" && ticket.id) {
        receiptTickets.push({ id: ticket.id, token });
      } else {
        if (ticket.details?.error === "DeviceNotRegistered") invalidTokens.push(token);
        console.error("Expo push ticket error", ticket.message ?? ticket.details?.error);
      }
    });
  }

  await deleteInvalidTokens(invalidTokens);

  if (receiptTickets.length > 0) {
    const timer = setTimeout(() => {
      void checkReceipts(receiptTickets).catch((error: unknown) => {
        console.error("Failed to check Expo push receipts", error);
      });
    }, RECEIPT_DELAY_MS);
    timer.unref();
  }
};
