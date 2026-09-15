import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.PAYMENT;

const createRazorpayOrderPayload = z.strictObject(
  {
    subscription_uuid: z.uuid({ error: messages.SUBSCRIPTION_UUID_INVALID }),
  },
  { error: messages.UNKNOWN_FIELDS },
);

const razorpayIdentifier = z.string().trim().min(1).max(255);
const verifyRazorpayPaymentPayload = z.strictObject(
  {
    razorpay_payment_id: razorpayIdentifier,
    razorpay_order_id: razorpayIdentifier,
    razorpay_signature: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i),
  },
  { error: messages.UNKNOWN_FIELDS },
);

const googlePlaySubscriptionPayload = z.strictObject(
  {
    subscription_uuid: z.uuid({ error: messages.SUBSCRIPTION_UUID_INVALID }),
    purchase_token: z
      .string({ error: messages.PURCHASE_TOKEN_INVALID })
      .trim()
      .min(1, { error: messages.PURCHASE_TOKEN_INVALID })
      .max(4096, { error: messages.PURCHASE_TOKEN_INVALID }),
  },
  { error: messages.UNKNOWN_FIELDS },
);

export const validateCreateRazorpayOrder = validateRequest({
  body: createRazorpayOrderPayload,
  errorMessage: messages.ORDER_VALIDATION_FAILED,
});

export const validateVerifyRazorpayPayment = validateRequest({
  body: verifyRazorpayPaymentPayload,
  errorMessage: messages.VERIFICATION_VALIDATION_FAILED,
});

export const validateGooglePlaySubscription = validateRequest({
  body: googlePlaySubscriptionPayload,
  errorMessage: messages.GOOGLE_PLAY_VALIDATION_FAILED,
});
