import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.CUSTOMER_MANAGEMENT;

const fields = {
  connect_user_id: z
    .number({ error: messages.CONNECT_USER_ID_REQUIRED })
    .int({ error: messages.CONNECT_USER_ID_INVALID })
    .positive({ error: messages.CONNECT_USER_ID_INVALID }),
  business_id: z
    .number({ error: messages.BUSINESS_ID_REQUIRED })
    .int({ error: messages.BUSINESS_ID_INVALID })
    .positive({ error: messages.BUSINESS_ID_INVALID }),
  role: z
    .string({ error: messages.ROLE_REQUIRED })
    .trim()
    .min(2, { error: messages.ROLE_MIN_LENGTH })
    .max(50, { error: messages.ROLE_MAX_LENGTH }),
};

const uuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) => (issue.input === undefined ? messages.UUID_REQUIRED : messages.UUID_INVALID),
  }),
});

const createPayload = z.strictObject(fields, { error: messages.UNKNOWN_FIELDS });

const updatePayload = z
  .strictObject(
    {
      connect_user_id: fields.connect_user_id.optional(),
      business_id: fields.business_id.optional(),
      role: fields.role.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, { error: messages.UPDATE_EMPTY });

export const validateCreateCustomerManagement = validateRequest({
  body: createPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateCustomerManagement = validateRequest({
  body: updatePayload,
  params: uuidParams,
  errorMessage: messages.UPDATE_VALIDATION_FAILED,
});

export const validateCustomerManagementUuid = validateRequest({
  params: uuidParams,
  errorMessage: messages.UUID_VALIDATION_FAILED,
});
