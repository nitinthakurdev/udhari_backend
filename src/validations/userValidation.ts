import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";
import validationMessageJson from "../../validationMessage.json";

const userValidationMessages = validationMessageJson.USER;

const capitalizeName = (name: string): string =>
  name.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (character) => character.toUpperCase());

export const signupValidationPayload = z.strictObject(
  {
    first_name: z
      .string({ error: userValidationMessages.FIRST_NAME_REQUIRED })
      .trim()
      .min(2, { error: userValidationMessages.FIRST_NAME_MIN_LENGTH })
      .max(50, { error: userValidationMessages.FIRST_NAME_MAX_LENGTH })
      .regex(/^[\p{L}][\p{L}\s'-]*$/u, {
        error: userValidationMessages.FIRST_NAME_INVALID,
      })
      .transform(capitalizeName),
    last_name: z
      .string({ error: userValidationMessages.LAST_NAME_INVALID })
      .trim()
      .max(50, { error: userValidationMessages.LAST_NAME_MAX_LENGTH })
      .regex(/^[\p{L}][\p{L}\s'-]*$/u, {
        error: userValidationMessages.LAST_NAME_INVALID,
      })
      .transform(capitalizeName)
      .nullable()
      .optional()
      .default(null),
    email: z
      .string({ error: userValidationMessages.EMAIL_REQUIRED })
      .trim()
      .toLowerCase()
      .min(1, { error: userValidationMessages.EMAIL_REQUIRED })
      .max(254, { error: userValidationMessages.EMAIL_MAX_LENGTH })
      .pipe(z.email({ error: userValidationMessages.EMAIL_INVALID }))
      .transform((email) => email.toLowerCase()),
    username: z
      .string({ error: userValidationMessages.USERNAME_REQUIRED })
      .trim()
      .toLowerCase()
      .min(3, { error: userValidationMessages.USERNAME_MIN_LENGTH })
      .max(30, { error: userValidationMessages.USERNAME_MAX_LENGTH })
      .regex(/^[a-zA-Z0-9_]+$/, {
        error: userValidationMessages.USERNAME_INVALID,
      })
      .transform((username) => username.toLowerCase()),
    phone: z
      .string({ error: userValidationMessages.PHONE_REQUIRED })
      .trim()
      .regex(/^\d{7,15}$/, { error: userValidationMessages.PHONE_INVALID }),
    dial_code: z.string().nullable().optional(),
    password: z
      .string({ error: userValidationMessages.PASSWORD_REQUIRED })
      .min(8, { error: userValidationMessages.PASSWORD_MIN_LENGTH })
      .max(72, { error: userValidationMessages.PASSWORD_MAX_LENGTH })
      .regex(/[a-z]/, { error: userValidationMessages.PASSWORD_LOWERCASE })
      .regex(/[A-Z]/, { error: userValidationMessages.PASSWORD_UPPERCASE })
      .regex(/\d/, { error: userValidationMessages.PASSWORD_NUMBER })
      .regex(/[^a-zA-Z0-9]/, { error: userValidationMessages.PASSWORD_SPECIAL_CHARACTER }),
  },
  { error: userValidationMessages.UNKNOWN_FIELDS },
);

export const validateSignup = validateRequest({
  body: signupValidationPayload,
  errorMessage: userValidationMessages.SIGNUP_VALIDATION_FAILED,
});

export const signinValidationPayload = z.strictObject(
  {
    identifier: z
      .string({ error: userValidationMessages.IDENTIFIER_REQUIRED })
      .trim()
      .toLowerCase()
      .min(1, { error: userValidationMessages.IDENTIFIER_REQUIRED })
      .max(254, { error: userValidationMessages.IDENTIFIER_INVALID })
      .refine(
        (identifier) =>
          z.email().safeParse(identifier).success || /^[a-zA-Z0-9_]{3,30}$/.test(identifier),
        { error: userValidationMessages.IDENTIFIER_INVALID },
      ),
    password: z
      .string({ error: userValidationMessages.PASSWORD_REQUIRED })
      .min(1, { error: userValidationMessages.PASSWORD_REQUIRED })
      .max(72, { error: userValidationMessages.PASSWORD_MAX_LENGTH }),
  },
  { error: userValidationMessages.UNKNOWN_FIELDS },
);

export const validateSignin = validateRequest({
  body: signinValidationPayload,
  errorMessage: userValidationMessages.SIGNIN_VALIDATION_FAILED,
});
