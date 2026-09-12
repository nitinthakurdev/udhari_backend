import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.UNIT;

const name = z
  .string({ error: messages.NAME_REQUIRED })
  .trim()
  .min(1, { error: messages.NAME_REQUIRED })
  .max(50, { error: messages.NAME_MAX_LENGTH });

const uuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) => (issue.input === undefined ? messages.UUID_REQUIRED : messages.UUID_INVALID),
  }),
});

const createPayload = z.strictObject({ name }, { error: messages.UNKNOWN_FIELDS });

const updatePayload = z
  .strictObject({ name: name.optional() }, { error: messages.UNKNOWN_FIELDS })
  .refine((data) => Object.keys(data).length > 0, { error: messages.UPDATE_EMPTY });

export const validateCreateUnit = validateRequest({
  body: createPayload,
  errorMessage: messages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateUnit = validateRequest({
  body: updatePayload,
  params: uuidParams,
  errorMessage: messages.UPDATE_VALIDATION_FAILED,
});

export const validateUnitUuid = validateRequest({
  params: uuidParams,
  errorMessage: messages.UUID_VALIDATION_FAILED,
});
