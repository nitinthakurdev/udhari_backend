import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";

const uuidParams = z.strictObject({
  uuid: z.uuid({ error: "A valid billing UUID is required." }),
});

const listQuery = z.strictObject({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  year: z.coerce.number().int().min(2026).max(9999).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

const paymentPayload = z.strictObject({
  amount: z
    .number({ error: "Payment amount is required." })
    .positive({ error: "Payment amount must be greater than zero." })
    .max(9_999_999_999.99, { error: "Payment amount is too large." }),
});

const dueDatePayload = z.strictObject({
  extend_due_date: z.iso.date({ error: "A valid extended due date is required." }),
});

const generateBillingPayload = z.strictObject({
  due_date: z.iso.date({ error: "A valid due date is required." }),
});

export const validateBillingUuid = validateRequest({
  params: uuidParams,
  errorMessage: "Invalid billing identifier.",
});

export const validateBillingList = validateRequest({
  query: listQuery,
  errorMessage: "Invalid billing list query.",
});

export const validateRecordBillingPayment = validateRequest({
  params: uuidParams,
  body: paymentPayload,
  errorMessage: "Invalid payment details.",
});

export const validateExtendBillingDueDate = validateRequest({
  params: uuidParams,
  body: dueDatePayload,
  errorMessage: "Invalid extended due date.",
});

export const validateGenerateBilling = validateRequest({
  params: uuidParams,
  body: generateBillingPayload,
  errorMessage: "Invalid billing due date.",
});
