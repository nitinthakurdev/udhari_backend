import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.TRANSITION;

const fields = {
  user_id: z
    .number({ error: messages.USER_ID_REQUIRED })
    .int({ error: messages.USER_ID_INVALID })
    .positive({ error: messages.USER_ID_INVALID }),
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
    .int({ error: messages.PRODUCT_QTY_INVALID })
    .positive({ error: messages.PRODUCT_QTY_INVALID })
    .max(1_000_000, { error: messages.PRODUCT_QTY_MAX }),
  product_price: z
    .number({ error: messages.PRODUCT_PRICE_REQUIRED })
    .nonnegative({ error: messages.PRODUCT_PRICE_INVALID })
    .max(9_999_999_999.99, { error: messages.PRODUCT_PRICE_MAX }),
  total_price: z
    .number({ error: messages.TOTAL_PRICE_REQUIRED })
    .nonnegative({ error: messages.TOTAL_PRICE_INVALID })
    .max(9_999_999_999.99, { error: messages.TOTAL_PRICE_MAX }),
  status: z
    .string({ error: messages.STATUS_INVALID })
    .trim()
    .min(2, { error: messages.STATUS_INVALID })
    .max(30, { error: messages.STATUS_MAX_LENGTH }),
  approved_by_user: z.boolean({ error: messages.APPROVED_BY_USER_INVALID }),
  approved_by_business: z.boolean({ error: messages.APPROVED_BY_BUSINESS_INVALID }),
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

const createPayload = z.strictObject(
  {
    user_id: fields.user_id,
    business_id: fields.business_id,
    unit_id: fields.unit_id,
    product_name: fields.product_name,
    product_qty: fields.product_qty.optional(),
    product_price: fields.product_price,
    total_price: fields.total_price,
    status: fields.status.optional(),
    comment: fields.comment.optional(),
  },
  { error: messages.UNKNOWN_FIELDS },
);

const updatePayload = z
  .strictObject(
    {
      product_name: fields.product_name.optional(),
      unit_id: fields.unit_id.optional(),
      product_qty: fields.product_qty.optional(),
      product_price: fields.product_price.optional(),
      total_price: fields.total_price.optional(),
      status: fields.status.optional(),
      approved_by_user: fields.approved_by_user.optional(),
      approved_by_business: fields.approved_by_business.optional(),
      comment: fields.comment.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, { error: messages.UPDATE_EMPTY });

export const validateCreateTransition = validateRequest({
  body: createPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateTransition = validateRequest({
  body: updatePayload,
  params: uuidParams,
  errorMessage: messages.UPDATE_VALIDATION_FAILED,
});

export const validateTransitionUuid = validateRequest({
  params: uuidParams,
  errorMessage: messages.UUID_VALIDATION_FAILED,
});
