import { validateRequest } from "@/middlewares/validationMiddleware";
import * as z from "zod";

const uuidParams = z.strictObject({ uuid: z.uuid("Invalid configuration ID.") });
const positiveMoney = z.number().nonnegative().max(9_999_999_999.99);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use time in HH:mm format.");
const timeRange = z
  .strictObject({ start_time: time, end_time: time })
  .refine((range) => range.end_time > range.start_time, {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

const fields = {
  business_uuid: z.uuid("Select a valid business.").optional(),
  customer_id: z.number().int().positive("Select a valid user.").optional(),
  customer_business_uuid: z.uuid("Select a valid connected business.").optional(),
  type: z.enum(["product", "service"]),
  name: z.string().trim().min(2).max(150),
  unit_id: z.number().int().positive().nullable(),
  quantity: z.number().positive().max(1_000_000).nullable(),
  unit_price: positiveMoney,
  week_days: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .min(1, "Select at least one weekday.")
    .max(7),
  time_ranges: z.array(timeRange).min(1, "Add at least one time range.").max(5),
};

const validateProductFields = (
  data: { type?: "product" | "service"; unit_id?: number | null; quantity?: number | null },
  context: z.RefinementCtx,
) => {
  if (data.type === "product" && (!data.unit_id || !data.quantity)) {
    context.addIssue({
      code: "custom",
      message: "Products require a quantity and unit.",
      path: ["quantity"],
    });
  }
  if (data.type === "service" && (data.unit_id != null || data.quantity != null)) {
    context.addIssue({
      code: "custom",
      message: "Services must not include a quantity or unit.",
      path: ["quantity"],
    });
  }
};

const createPayload = z.strictObject(fields).superRefine((data, context) => {
  validateProductFields(data, context);
  if (!data.customer_id && !data.customer_business_uuid) {
    context.addIssue({
      code: "custom",
      message: "Select a connected user or business.",
      path: ["customer_id"],
    });
  }
  if (data.customer_id && data.customer_business_uuid) {
    context.addIssue({
      code: "custom",
      message: "Select either a user or a business, not both.",
      path: ["customer_id"],
    });
  }
});
const updatePayload = z
  .strictObject({
    type: fields.type,
    name: fields.name,
    unit_id: fields.unit_id,
    quantity: fields.quantity,
    unit_price: fields.unit_price,
    week_days: fields.week_days,
    time_ranges: fields.time_ranges,
  })
  .superRefine(validateProductFields);
const sendPayload = z
  .strictObject({
    type: fields.type,
    name: fields.name,
    unit_id: fields.unit_id,
    quantity: fields.quantity,
    unit_price: fields.unit_price,
    total_price: positiveMoney,
    comment: z.string().trim().max(2_000).nullable(),
    occurrence_key: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}:([01]\d|2[0-3]):[0-5]\d$/, "Invalid occurrence key."),
    action: z.enum(["edit", "approved", "rejected"]),
  })
  .superRefine(validateProductFields);

export const validateCreateRecurringTransactionConfig = validateRequest({
  body: createPayload,
  errorMessage: "Invalid scheduled configuration.",
});

export const validateUpdateRecurringTransactionConfig = validateRequest({
  body: updatePayload,
  params: uuidParams,
  errorMessage: "Invalid scheduled configuration.",
});

export const validateRecurringTransactionConfigUuid = validateRequest({
  params: uuidParams,
  errorMessage: "Invalid configuration ID.",
});

export const validateSendRecurringTransactionConfig = validateRequest({
  body: sendPayload,
  params: uuidParams,
  errorMessage: "Invalid scheduled transition details.",
});
