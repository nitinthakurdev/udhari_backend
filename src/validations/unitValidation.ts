import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const messages = validationMessages.UNIT;

const name = z
  .string({ error: messages.NAME_REQUIRED })
  .trim()
  .min(1, { error: messages.NAME_REQUIRED })
  .max(50, { error: messages.NAME_MAX_LENGTH });

const code = z
  .string({ error: messages.CODE_REQUIRED })
  .trim()
  .min(1, { error: messages.CODE_REQUIRED })
  .max(20, { error: messages.CODE_MAX_LENGTH })
  .regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, { error: messages.CODE_INVALID })
  .transform((value) => value.toLowerCase());

const type = z
  .string({ error: messages.TYPE_REQUIRED })
  .trim()
  .min(1, { error: messages.TYPE_REQUIRED })
  .max(30, { error: messages.TYPE_MAX_LENGTH })
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, { error: messages.TYPE_INVALID })
  .transform((value) => value.toLowerCase());

const factor = z
  .number({ error: messages.FACTOR_REQUIRED })
  .positive({ error: messages.FACTOR_INVALID })
  .max(1_000_000_000, { error: messages.FACTOR_MAX });

const uuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) => (issue.input === undefined ? messages.UUID_REQUIRED : messages.UUID_INVALID),
  }),
});

const createPayload = z.strictObject(
  { name, code, type, factor },
  { error: messages.UNKNOWN_FIELDS },
);

const updatePayload = z
  .strictObject(
    {
      name: name.optional(),
      code: code.optional(),
      type: type.optional(),
      factor: factor.optional(),
    },
    { error: messages.UNKNOWN_FIELDS },
  )
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
