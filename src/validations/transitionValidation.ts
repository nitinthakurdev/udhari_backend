import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.TRANSITION;

const fields = {
  customer_user_id: z
    .number({ error: messages.CUSTOMER_USER_ID_REQUIRED })
    .int({ error: messages.CUSTOMER_USER_ID_INVALID })
    .positive({ error: messages.CUSTOMER_USER_ID_INVALID }),
  customer_business_id: z
    .number({ error: messages.CUSTOMER_BUSINESS_ID_INVALID })
    .int({ error: messages.CUSTOMER_BUSINESS_ID_INVALID })
    .positive({ error: messages.CUSTOMER_BUSINESS_ID_INVALID })
    .nullable(),
  business_id: z
    .number({ error: messages.BUSINESS_ID_REQUIRED })
    .int({ error: messages.BUSINESS_ID_INVALID })
    .positive({ error: messages.BUSINESS_ID_INVALID }),
  unit_id: z
    .number({ error: messages.UNIT_ID_REQUIRED })
    .int({ error: messages.UNIT_ID_INVALID })
    .positive({ error: messages.UNIT_ID_INVALID }),
  product_name: z
    .string({ error: messages.PRODUCT_NAME_REQUIRED })
    .trim()
    .min(2, { error: messages.PRODUCT_NAME_MIN_LENGTH })
    .max(150, { error: messages.PRODUCT_NAME_MAX_LENGTH }),
  product_qty: z
    .number({ error: messages.PRODUCT_QTY_INVALID })
    .positive({ error: messages.PRODUCT_QTY_INVALID })
    .max(1_000_000, { error: messages.PRODUCT_QTY_MAX }),
  product_unit_price: z
    .number({ error: messages.PRODUCT_UNIT_PRICE_REQUIRED })
    .nonnegative({ error: messages.PRODUCT_UNIT_PRICE_INVALID })
    .max(9_999_999_999.99, { error: messages.PRODUCT_UNIT_PRICE_MAX }),
  total_price: z
    .number({ error: messages.TOTAL_PRICE_REQUIRED })
    .nonnegative({ error: messages.TOTAL_PRICE_INVALID })
    .max(9_999_999_999.99, { error: messages.TOTAL_PRICE_MAX }),
  request_status: z.literal("approved", { error: messages.REQUEST_STATUS_INVALID }),
  balance_type: z.enum(["payable", "receivable"], {
    error: messages.BALANCE_TYPE_INVALID,
  }),
  comment: z
    .string({ error: messages.COMMENT_INVALID })
    .trim()
    .max(2_000, { error: messages.COMMENT_MAX_LENGTH })
    .nullable()
    .transform((comment) => (comment && comment.length > 0 ? comment : null)),
};

const uuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) => (issue.input === undefined ? messages.UUID_REQUIRED : messages.UUID_INVALID),
  }),
});

const listQuery = z
  .strictObject({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    view: z.enum(["all", "unpaid", "cancelled"]).default("all"),
    party_type: z.enum(["user", "business"]).optional(),
    party_id: z.coerce.number().int().positive().optional(),
  })
  .refine((query) => (query.party_type === undefined) === (query.party_id === undefined), {
    error: "party_type and party_id must be provided together.",
    path: ["party_id"],
  });

const createPayload = z
  .strictObject(
    {
      customer_user_id: fields.customer_user_id.optional(),
      customer_business_id: fields.customer_business_id.optional(),
      business_id: fields.business_id,
      unit_id: fields.unit_id,
      product_name: fields.product_name,
      product_qty: fields.product_qty.optional(),
      product_unit_price: fields.product_unit_price,
      total_price: fields.total_price,
      customer_business_uuid: z.uuid({ error: messages.CUSTOMER_BUSINESS_UUID_INVALID }).optional(),
      balance_type: fields.balance_type.optional(),
      comment: fields.comment.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => data.customer_business_uuid === undefined || data.balance_type !== undefined, {
    error: messages.BALANCE_TYPE_REQUIRED,
    path: ["balance_type"],
  });

const batchItem = z.strictObject(
  {
    unit_id: fields.unit_id,
    product_name: fields.product_name,
    product_qty: fields.product_qty.optional(),
    product_unit_price: fields.product_unit_price,
    total_price: fields.total_price,
    comment: fields.comment.optional(),
  },
  { error: messages.UNKNOWN_FIELDS },
);

const batchCreatePayload = z
  .strictObject(
    {
      customer_user_id: fields.customer_user_id.optional(),
      business_id: fields.business_id,
      customer_business_uuid: z.uuid({ error: messages.CUSTOMER_BUSINESS_UUID_INVALID }).optional(),
      balance_type: fields.balance_type.optional(),
      items: z.array(batchItem).min(1).max(50),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => data.customer_business_uuid === undefined || data.balance_type !== undefined, {
    error: messages.BALANCE_TYPE_REQUIRED,
    path: ["balance_type"],
  });

const updatePayload = z
  .strictObject(
    {
      product_name: fields.product_name.optional(),
      unit_id: fields.unit_id.optional(),
      product_qty: fields.product_qty.optional(),
      product_unit_price: fields.product_unit_price.optional(),
      total_price: fields.total_price.optional(),
      request_status: fields.request_status.optional(),
      balance_type: fields.balance_type.optional(),
      comment: fields.comment.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, { error: messages.UPDATE_EMPTY })
  .refine((data) => data.request_status === undefined || Object.keys(data).length === 1, {
    error: messages.APPROVAL_WITH_CHANGES,
  });

export const validateCreateTransition = validateRequest({
  body: createPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateTransition = validateRequest({
  body: updatePayload,
  params: uuidParams,
  errorMessage: messages.UPDATE_VALIDATION_FAILED,
});

export const validateBatchCreateTransition = validateRequest({
  body: batchCreatePayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateTransitionUuid = validateRequest({
  params: uuidParams,
  errorMessage: messages.UUID_VALIDATION_FAILED,
});

export const validateListTransitions = validateRequest({
  query: listQuery,
  errorMessage: "Invalid transition list query.",
});
