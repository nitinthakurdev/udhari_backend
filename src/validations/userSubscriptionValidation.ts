import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.USER_SUBSCRIPTION;

const uuid = (requiredMessage: string, invalidMessage: string) =>
  z.uuid({
    error: (issue) => (issue.input === undefined ? requiredMessage : invalidMessage),
  });

const expiryAt = z.iso
  .datetime({
    offset: true,
    error: (issue) =>
      issue.input === undefined ? messages.EXPIRY_REQUIRED : messages.EXPIRY_INVALID,
  })
  .transform((value) => new Date(value))
  .refine((value) => value.getTime() > Date.now(), { error: messages.EXPIRY_FUTURE });

const params = z.strictObject({
  uuid: uuid(messages.UUID_REQUIRED, messages.UUID_INVALID),
});

const createPayload = z.strictObject(
  {
    user_uuid: uuid(messages.USER_UUID_REQUIRED, messages.USER_UUID_INVALID),
    subscription_uuid: uuid(
      messages.SUBSCRIPTION_UUID_REQUIRED,
      messages.SUBSCRIPTION_UUID_INVALID,
    ),
    expiry_at: expiryAt,
  },
  { error: messages.UNKNOWN_FIELDS },
);

const freeSubscriptionPayload = z.strictObject(
  {
    subscription_uuid: uuid(
      messages.SUBSCRIPTION_UUID_REQUIRED,
      messages.SUBSCRIPTION_UUID_INVALID,
    ),
  },
  { error: messages.UNKNOWN_FIELDS },
);

const updatePayload = z
  .strictObject(
    {
      subscription_uuid: uuid(
        messages.SUBSCRIPTION_UUID_REQUIRED,
        messages.SUBSCRIPTION_UUID_INVALID,
      ).optional(),
      expiry_at: expiryAt.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, { error: messages.UPDATE_EMPTY });

export const validateCreateUserSubscription = validateRequest({
  body: createPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateFreeSubscription = validateRequest({
  body: freeSubscriptionPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateUserSubscription = validateRequest({
  body: updatePayload,
  params,
  errorMessage: messages.UPDATE_VALIDATION_FAILED,
});

export const validateUserSubscriptionUuid = validateRequest({
  params,
  errorMessage: messages.UUID_VALIDATION_FAILED,
});
