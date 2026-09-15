import { validateRequest } from "@/middlewares/validationMiddleware";
import { SUBSCRIPTION_DURATION_TYPES } from "@/types/subscriptionTypes";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const subscriptionMessages = validationMessages.SUBSCRIPTION;

const subscriptionLimit = (requiredMessage: string) =>
  z
    .number({ error: requiredMessage })
    .int({ error: subscriptionMessages.CONFIG_LIMIT_INVALID })
    .nonnegative({ error: subscriptionMessages.CONFIG_LIMIT_INVALID })
    .max(2_147_483_647, { error: subscriptionMessages.CONFIG_LIMIT_MAX });

const subscriptionConfig = z.strictObject(
  {
    allowed_transitions: subscriptionLimit(subscriptionMessages.TRANSITION_LIMIT_REQUIRED),
    allowed_connected_customers: subscriptionLimit(
      subscriptionMessages.CONNECTED_CUSTOMER_LIMIT_REQUIRED,
    ),
    allowed_connected_businesses: subscriptionLimit(
      subscriptionMessages.CONNECTED_BUSINESS_LIMIT_REQUIRED,
    ),
    allowed_connected_users: subscriptionLimit(subscriptionMessages.CONNECTED_USER_LIMIT_REQUIRED),
    allowed_managed_businesses: subscriptionLimit(
      subscriptionMessages.MANAGED_BUSINESS_LIMIT_REQUIRED,
    ),
  },
  { error: subscriptionMessages.CONFIG_INVALID },
);

const subscriptionFields = {
  name: z
    .string({ error: subscriptionMessages.NAME_REQUIRED })
    .trim()
    .min(2, { error: subscriptionMessages.NAME_MIN_LENGTH })
    .max(100, { error: subscriptionMessages.NAME_MAX_LENGTH }),
  description: z
    .string({ error: subscriptionMessages.DESCRIPTION_REQUIRED })
    .trim()
    .min(10, { error: subscriptionMessages.DESCRIPTION_MIN_LENGTH })
    .max(1000, { error: subscriptionMessages.DESCRIPTION_MAX_LENGTH }),
  features: z
    .array(
      z
        .string()
        .trim()
        .min(2, { error: subscriptionMessages.FEATURE_MIN_LENGTH })
        .max(200, { error: subscriptionMessages.FEATURE_MAX_LENGTH }),
      { error: subscriptionMessages.FEATURES_REQUIRED },
    )
    .min(1, { error: subscriptionMessages.FEATURES_MIN })
    .max(20, { error: subscriptionMessages.FEATURES_MAX }),
  price: z
    .number({ error: subscriptionMessages.PRICE_REQUIRED })
    .nonnegative({ error: subscriptionMessages.PRICE_INVALID })
    .max(99999999.99, { error: subscriptionMessages.PRICE_MAX }),
  currency: z
    .string({ error: subscriptionMessages.CURRENCY_REQUIRED })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, { error: subscriptionMessages.CURRENCY_INVALID }),
  duration: z
    .number({ error: subscriptionMessages.DURATION_REQUIRED })
    .int({ error: subscriptionMessages.DURATION_INVALID })
    .positive({ error: subscriptionMessages.DURATION_INVALID })
    .max(1200, { error: subscriptionMessages.DURATION_MAX }),
  duration_type: z.enum(SUBSCRIPTION_DURATION_TYPES, {
    error: subscriptionMessages.DURATION_TYPE_INVALID,
  }),
  is_active: z.boolean({ error: subscriptionMessages.IS_ACTIVE_INVALID }),
  google_play_product_id: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._]+$/)
    .nullable(),
  auto_renewal_enabled: z.boolean(),
  role_id: z
    .number({ error: subscriptionMessages.ROLE_ID_REQUIRED })
    .int({ error: subscriptionMessages.ROLE_ID_INVALID })
    .positive({ error: subscriptionMessages.ROLE_ID_INVALID }),
};

export const createSubscriptionValidationPayload = z.strictObject(
  {
    name: subscriptionFields.name,
    description: subscriptionFields.description,
    features: subscriptionFields.features,
    price: subscriptionFields.price,
    currency: subscriptionFields.currency.optional(),
    duration: subscriptionFields.duration,
    duration_type: subscriptionFields.duration_type.optional(),
    is_active: subscriptionFields.is_active.optional(),
    google_play_product_id: subscriptionFields.google_play_product_id.optional(),
    auto_renewal_enabled: subscriptionFields.auto_renewal_enabled.optional(),
    role_id: subscriptionFields.role_id,
    config: subscriptionConfig,
  },
  { error: subscriptionMessages.UNKNOWN_FIELDS },
);

export const updateSubscriptionValidationPayload = z
  .strictObject(
    {
      name: subscriptionFields.name.optional(),
      description: subscriptionFields.description.optional(),
      features: subscriptionFields.features.optional(),
      price: subscriptionFields.price.optional(),
      currency: subscriptionFields.currency.optional(),
      duration: subscriptionFields.duration.optional(),
      duration_type: subscriptionFields.duration_type.optional(),
      is_active: subscriptionFields.is_active.optional(),
      google_play_product_id: subscriptionFields.google_play_product_id.optional(),
      auto_renewal_enabled: subscriptionFields.auto_renewal_enabled.optional(),
      role_id: subscriptionFields.role_id.optional(),
      config: subscriptionConfig.optional(),
    },
    { error: subscriptionMessages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, {
    error: subscriptionMessages.UPDATE_EMPTY,
  });

export const subscriptionUuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? subscriptionMessages.UUID_REQUIRED
        : subscriptionMessages.UUID_INVALID,
  }),
});

export const validateCreateSubscription = validateRequest({
  body: createSubscriptionValidationPayload,
  errorMessage: subscriptionMessages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateSubscription = validateRequest({
  body: updateSubscriptionValidationPayload,
  params: subscriptionUuidParams,
  errorMessage: subscriptionMessages.UPDATE_VALIDATION_FAILED,
});

export const validateSubscriptionUuid = validateRequest({
  params: subscriptionUuidParams,
  errorMessage: subscriptionMessages.UUID_VALIDATION_FAILED,
});
