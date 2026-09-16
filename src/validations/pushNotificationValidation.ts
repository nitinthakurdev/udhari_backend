import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";

const expoPushToken = z
  .string()
  .trim()
  .max(255)
  .regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/, {
    error: "Enter a valid Expo push token.",
  });

export const validateRegisterPushToken = validateRequest({
  body: z.strictObject({
    expo_push_token: expoPushToken,
    platform: z.enum(["android", "ios"]),
    device_name: z.string().trim().max(120).nullable().optional(),
  }),
  errorMessage: "Please provide valid push notification device details.",
});

export const validateUnregisterPushToken = validateRequest({
  body: z.strictObject({ expo_push_token: expoPushToken }),
  errorMessage: "Please provide a valid push notification token.",
});
