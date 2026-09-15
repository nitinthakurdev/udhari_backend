import type { ISubscriptionSchema } from "@/types/subscriptionTypes";

type SubscriptionPeriod = globalThis.Pick<
  ISubscriptionSchema,
  "duration" | "duration_type"
>;

export const calculateSubscriptionExpiry = (
  subscription: SubscriptionPeriod,
  startsAt = new Date(),
): Date => {
  const expiry = new Date(startsAt);
  const originalDay = expiry.getUTCDate();
  const monthsPerDuration =
    subscription.duration_type === "YEARLY"
      ? 12
      : subscription.duration_type === "QUARTERLY"
        ? 3
        : 1;
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + subscription.duration * monthsPerDuration);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0),
  ).getUTCDate();
  expiry.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return expiry;
};
