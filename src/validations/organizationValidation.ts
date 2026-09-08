import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const organizationValidationMessages = validationMessages.ORGANIZATION;

const organizationFields = {
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
};

export const createOrganizationValidationPayload = z.strictObject(organizationFields, {
  error: organizationValidationMessages.UNKNOWN_FIELDS,
});

export const updateOrganizationValidationPayload = z
  .strictObject(
    {
      name: organizationFields.name.optional(),
      country: organizationFields.country.optional(),
      state: organizationFields.state.optional(),
      city: organizationFields.city.optional(),
      address: organizationFields.address.optional(),
      address_2: organizationFields.address_2,
    },
    { error: organizationValidationMessages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, {
    error: organizationValidationMessages.UPDATE_EMPTY,
  });

export const organizationUuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? organizationValidationMessages.UUID_REQUIRED
        : organizationValidationMessages.UUID_INVALID,
  }),
});

export const validateCreateOrganization = validateRequest({
  body: createOrganizationValidationPayload,
  errorMessage: organizationValidationMessages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateOrganization = validateRequest({
  body: updateOrganizationValidationPayload,
  params: organizationUuidParams,
  errorMessage: organizationValidationMessages.UPDATE_VALIDATION_FAILED,
});

export const validateOrganizationUuid = validateRequest({
  params: organizationUuidParams,
  errorMessage: organizationValidationMessages.UUID_VALIDATION_FAILED,
});
