import {
  extendBillingDueDate,
  findBillingByUuid,
  findBillings,
  generateBilling,
  recordBillingPayment,
} from "@/services/billingService";
import type {
  IBillingListOptions,
  IExtendBillingDueDatePayload,
  IGenerateBillingPayload,
  IRecordBillingPaymentPayload,
} from "@/types/billingTypes";
import {
  AsyncHandler,
  BadRequestError,
  ForbiddenError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import { notifyUsers } from "@/socket";

const response = new HalSuccess();

const getListOptions = (query: Record<string, unknown>): IBillingListOptions => ({
  page: Number(query["page"] ?? 1),
  limit: Number(query["limit"] ?? 20),
  paginated: query["page"] !== undefined || query["limit"] !== undefined,
  ...(query["year"] !== undefined ? { year: Number(query["year"]) } : {}),
  ...(query["month"] !== undefined ? { month: Number(query["month"]) } : {}),
});

const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_previous_page: page > 1,
  };
};

export const listBillings = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const options = getListOptions(req.query);
  const result = await findBillings(req.currentUser.id, options);
  res.status(StatusCodes.OK).json(
    response.ok(result?.items ?? [], {
      message: "Monthly bills fetched successfully.",
      meta: { pagination: getPaginationMeta(options.page, options.limit, result?.total ?? 0) },
    }),
  );
});

export const listBusinessBillings = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const options = getListOptions(req.query);
  const result = await findBillings(req.currentUser.id, options, req.params["uuid"] as string);
  if (!result) throw new NotFoundError("Business not found or access was denied.");
  res.status(StatusCodes.OK).json(
    response.ok(result.items, {
      message: "Monthly bills fetched successfully.",
      meta: { pagination: getPaginationMeta(options.page, options.limit, result.total) },
    }),
  );
});

export const getBilling = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const billing = await findBillingByUuid(req.params["uuid"] as string, req.currentUser.id);
  if (!billing) throw new NotFoundError("Billing statement not found.");
  res.status(StatusCodes.OK).json(response.ok(billing));
});

export const receiveBillingPayment = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const result = await recordBillingPayment(
    req.params["uuid"] as string,
    (req.body as IRecordBillingPaymentPayload).amount,
    req.currentUser.id,
  );
  if (result.status !== "ok") {
    if (result.status === "not_found") throw new NotFoundError("Billing statement not found.");
    if (result.status === "forbidden") {
      throw new ForbiddenError("Only the business owner can record a received payment.");
    }
    throw new BadRequestError("Payment must be greater than zero and cannot exceed outstanding.");
  }
  notifyUsers([result.customerUserId], {
    type: "billing.payment_received",
    title: "Payment received",
    message: `A payment of ₹${String((req.body as IRecordBillingPaymentPayload).amount)} was recorded.`,
    data: { billing_uuid: result.billing.uuid },
  });
  res
    .status(StatusCodes.CREATED)
    .json(
      response.created(result.billing, { message: "Payment received and recorded successfully." }),
    );
});

export const updateBillingDueDate = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const result = await extendBillingDueDate(
    req.params["uuid"] as string,
    (req.body as IExtendBillingDueDatePayload).extend_due_date,
    req.currentUser.id,
  );
  if (result.status === "not_found") throw new NotFoundError("Billing statement not found.");
  if (result.status === "forbidden") {
    throw new ForbiddenError("Only the business owner can extend the due date.");
  }
  if (result.status === "not_generated") {
    throw new BadRequestError("Generate the bill before extending its due date.");
  }
  if (result.status === "invalid_date") {
    throw new BadRequestError("Extended due date must be later than the original due date.");
  }
  res
    .status(StatusCodes.OK)
    .json(response.ok(result.billing, { message: "Billing due date updated successfully." }));
});

export const generateMonthlyBilling = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError("Authentication is required.");
  const result = await generateBilling(
    req.params["uuid"] as string,
    (req.body as IGenerateBillingPayload).due_date,
    req.currentUser.id,
  );
  if (result.status === "not_found") throw new NotFoundError("Billing statement not found.");
  if (result.status === "forbidden") {
    throw new ForbiddenError("Only the business owner can generate the bill.");
  }
  if (result.status === "invalid_date") {
    throw new BadRequestError("Due date cannot be before the end of the billing month.");
  }
  res
    .status(StatusCodes.OK)
    .json(response.ok(result.billing, { message: "Bill generated successfully." }));
});
