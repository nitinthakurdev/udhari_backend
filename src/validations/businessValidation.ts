import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessages from "../../validationMessage.json";

const businessValidationMessages = validationMessages.BUSINESS;

const businessFields = {
  name: z
    .string({ error: businessValidationMessages.NAME_REQUIRED })
    .trim()
    .min(2, { error: businessValidationMessages.NAME_MIN_LENGTH })
    .max(100, { error: businessValidationMessages.NAME_MAX_LENGTH }),
  country: z
    .string({ error: businessValidationMessages.COUNTRY_REQUIRED })
    .trim()
    .min(1, { error: businessValidationMessages.COUNTRY_REQUIRED })
    .max(80, { error: businessValidationMessages.COUNTRY_MAX_LENGTH }),
  state: z
    .string({ error: businessValidationMessages.STATE_REQUIRED })
    .trim()
    .min(1, { error: businessValidationMessages.STATE_REQUIRED })
    .max(80, { error: businessValidationMessages.STATE_MAX_LENGTH }),
  city: z
    .string({ error: businessValidationMessages.CITY_REQUIRED })
    .trim()
    .min(1, { error: businessValidationMessages.CITY_REQUIRED })
    .max(80, { error: businessValidationMessages.CITY_MAX_LENGTH }),
  pincode: z
    .string({ error: businessValidationMessages.PINCODE_REQUIRED })
    .trim()
    .regex(/^\d{6}$/, { error: businessValidationMessages.PINCODE_INVALID }),
  address: z
    .string({ error: businessValidationMessages.ADDRESS_REQUIRED })
    .trim()
    .min(5, { error: businessValidationMessages.ADDRESS_MIN_LENGTH })
    .max(250, { error: businessValidationMessages.ADDRESS_MAX_LENGTH }),
  address_2: z
    .string()
    .trim()
    .max(250, { error: businessValidationMessages.ADDRESS_2_MAX_LENGTH })
    .nullable()
    .optional()
    .transform((address) => (address && address.length > 0 ? address : null)),
};

export const createBusinessValidationPayload = z.strictObject(businessFields, {
  error: businessValidationMessages.UNKNOWN_FIELDS,
});

export const updateBusinessValidationPayload = z
  .strictObject(
    {
      name: businessFields.name.optional(),
      country: businessFields.country.optional(),
      state: businessFields.state.optional(),
      city: businessFields.city.optional(),
      pincode: businessFields.pincode.optional(),
      address: businessFields.address.optional(),
      address_2: businessFields.address_2,
    },
    { error: businessValidationMessages.UNKNOWN_FIELDS },
  )
  .refine((data) => Object.keys(data).length > 0, {
    error: businessValidationMessages.UPDATE_EMPTY,
  });

export const businessUuidParams = z.strictObject({
  uuid: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? businessValidationMessages.UUID_REQUIRED
        : businessValidationMessages.UUID_INVALID,
  }),
});

export const validateCreateBusiness = validateRequest({
  body: createBusinessValidationPayload,
  errorMessage: businessValidationMessages.CREATE_VALIDATION_FAILED,
});

export const validateUpdateBusiness = validateRequest({
  body: updateBusinessValidationPayload,
  params: businessUuidParams,
  errorMessage: businessValidationMessages.UPDATE_VALIDATION_FAILED,
});

export const validateBusinessUuid = validateRequest({
  params: businessUuidParams,
  errorMessage: businessValidationMessages.UUID_VALIDATION_FAILED,
});
