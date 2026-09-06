import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const organizationValidationMessages = validationMessages.ORGANIZATION;

export const createOrganizationValidationPayload = z.strictObject(
  {
    name: z
      .string({ error: organizationValidationMessages.NAME_REQUIRED })
      .trim()
      .min(2, { error: organizationValidationMessages.NAME_MIN_LENGTH })
      .max(100, { error: organizationValidationMessages.NAME_MAX_LENGTH }),
    country: z
      .string({ error: organizationValidationMessages.COUNTRY_REQUIRED })
      .trim()
      .min(1, { error: organizationValidationMessages.COUNTRY_REQUIRED })
      .max(80, { error: organizationValidationMessages.COUNTRY_MAX_LENGTH }),
    state: z
      .string({ error: organizationValidationMessages.STATE_REQUIRED })
      .trim()
      .min(1, { error: organizationValidationMessages.STATE_REQUIRED })
      .max(80, { error: organizationValidationMessages.STATE_MAX_LENGTH }),
    city: z
      .string({ error: organizationValidationMessages.CITY_REQUIRED })
      .trim()
      .min(1, { error: organizationValidationMessages.CITY_REQUIRED })
      .max(80, { error: organizationValidationMessages.CITY_MAX_LENGTH }),
    address: z
      .string({ error: organizationValidationMessages.ADDRESS_REQUIRED })
      .trim()
      .min(5, { error: organizationValidationMessages.ADDRESS_MIN_LENGTH })
      .max(250, { error: organizationValidationMessages.ADDRESS_MAX_LENGTH }),
    address_2: z
      .string()
      .trim()
      .max(250, { error: organizationValidationMessages.ADDRESS_2_MAX_LENGTH })
      .nullable()
      .optional()
      .transform((address) => (address && address.length > 0 ? address : null)),
  },
  { error: organizationValidationMessages.UNKNOWN_FIELDS },
);

export const validateCreateOrganization = validateRequest({
  body: createOrganizationValidationPayload,
  errorMessage: organizationValidationMessages.CREATE_VALIDATION_FAILED,
});
