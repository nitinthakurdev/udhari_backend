import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const roleValidationMessages = validationMessages.ROLE;

export const createRoleValidationPayload = z.strictObject(
  {
    name: z
      .string({ error: roleValidationMessages.NAME_REQUIRED })
      .trim()
      .min(2, { error: roleValidationMessages.NAME_MIN_LENGTH })
      .max(50, { error: roleValidationMessages.NAME_MAX_LENGTH }),
    slug: z
      .string({ error: roleValidationMessages.SLAG_REQUIRED })
      .trim()
      .toLowerCase()
      .min(2, { error: roleValidationMessages.SLAG_MIN_LENGTH })
      .max(50, { error: roleValidationMessages.SLAG_MAX_LENGTH })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        error: roleValidationMessages.SLAG_INVALID,
      }),
  },
  { error: roleValidationMessages.UNKNOWN_FIELDS },
);

export const validateCreateRole = validateRequest({
  body: createRoleValidationPayload,
  errorMessage: roleValidationMessages.CREATE_VALIDATION_FAILED,
});
