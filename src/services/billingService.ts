import { billingModel } from "@/models/billingModel";
import { businessModel } from "@/models/businessModel";
import { sequelize } from "@/config/dbConfig";
import { paymentReceivedModel } from "@/models/paymentReceivedModel";
import { transitionsModel } from "@/models/transitionModel";
import { userModel } from "@/models/userModel";
import type {
  IBillingListOptions,
  IBillingPage,
  IBillingPublic,
  IBillingSchema,
} from "@/types/billingTypes";
import type { ITransitionSchema } from "@/types/transitionTypes";
import { Op, type Transaction, type WhereOptions } from "sequelize";

const MONEY_SCALE = 100;

const toCents = (value: number | string) => Math.round(Number(value) * MONEY_SCALE);
const fromCents = (value: number) => value / MONEY_SCALE;

const getIndiaDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: Number(value("year")), month: Number(value("month")), day: Number(value("day")) };
};

const formatDateOnly = (year: number, month: number, day: number) =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const getBillingPeriod = (date = new Date()) => {
  const { year, month } = getIndiaDateParts(date);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: formatDateOnly(year, month, 1),
    end: formatDateOnly(year, month, lastDay),
    due: formatDateOnly(year, month, lastDay),
    nextStart: formatDateOnly(nextYear, nextMonth, 1),
  };
};

const getBillingDateRange = (
  billing: Pick<IBillingSchema, "start_date_of_month" | "end_date_of_month">,
) => {
  const [year, month] = billing.start_date_of_month.split("-").map(Number);
  const nextYear = month === 12 ? (year ?? 0) + 1 : (year ?? 0);
  const nextMonth = month === 12 ? 1 : (month ?? 0) + 1;
  return {
    [Op.gte]: new Date(`${billing.start_date_of_month}T00:00:00+05:30`),
    [Op.lt]: new Date(`${formatDateOnly(nextYear, nextMonth, 1)}T00:00:00+05:30`),
  };
};

export const ensureMonthlyBilling = async (
  data: Pick<
    ITransitionSchema,
    | "customer_user_id"
    | "customer_business_id"
    | "business_id"
    | "business_user_id"
    | "balance_type"
    | "created_by"
  >,
  transaction: Transaction,
  date = new Date(),
) => {
  const period = getBillingPeriod(date);
  const reverseBusinessBalance =
    data.customer_business_id !== null && data.balance_type === "receivable";
  const customerId = reverseBusinessBalance ? data.business_user_id : data.customer_user_id;
  const businessId = reverseBusinessBalance
    ? (data.customer_business_id ?? data.business_id)
    : data.business_id;
  const businessOwnerId = reverseBusinessBalance ? data.customer_user_id : data.business_user_id;
  const customerBusinessId =
    data.customer_business_id === null
      ? null
      : reverseBusinessBalance
        ? data.business_id
        : data.customer_business_id;
  const [billing] = await billingModel.findOrCreate({
    where: {
      customer_id: customerId,
      customer_business_id: customerBusinessId,
      business_id: businessId,
      start_date_of_month: period.start,
      end_date_of_month: period.end,
    },
    defaults: {
      current_outstanding: 0,
      customer_id: customerId,
      customer_business_id: customerBusinessId,
      business_id: businessId,
      business_owner_id: businessOwnerId,
      start_date_of_month: period.start,
      end_date_of_month: period.end,
      due_date: period.due,
      extend_due_date: null,
      generated_at: null,
      created_by: data.created_by,
      updated_by: null,
    },
    transaction,
  });
  return billing;
};

export const addTransitionToOutstanding = async (
  transition: ITransitionSchema,
  updatedBy: number,
  transaction: Transaction,
) => {
  const billing = await ensureMonthlyBilling(
    transition,
    transaction,
    new Date(transition.created_at),
  );
  const lockedBilling = await billingModel.findByPk(billing.id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!lockedBilling) throw new Error("Billing disappeared while approving a transition.");

  const nextOutstanding =
    toCents(lockedBilling.current_outstanding) + toCents(transition.total_price);
  await lockedBilling.update(
    { current_outstanding: fromCents(nextOutstanding), updated_by: updatedBy },
    { transaction },
  );
};

const getApprovedTransitionsForBilling = async (
  billing: IBillingSchema,
  transaction?: Transaction,
) =>
  transitionsModel.findAll({
    where: {
      [Op.or]:
        billing.customer_business_id === null
          ? [
              {
                customer_user_id: billing.customer_id,
                customer_business_id: null,
                business_id: billing.business_id,
                balance_type: "payable",
              },
            ]
          : [
              {
                customer_business_id: billing.customer_business_id,
                business_id: billing.business_id,
                balance_type: "payable",
              },
              {
                customer_business_id: billing.business_id,
                business_id: billing.customer_business_id,
                balance_type: "receivable",
              },
            ],
      request_status: "approved",
      created_at: getBillingDateRange(billing),
    },
    attributes: ["id", "uuid", "product_name", "total_price", "created_at"],
    order: [
      ["created_at", "ASC"],
      ["id", "ASC"],
    ],
    ...(transaction ? { transaction } : {}),
  });

const getPaymentRows = async (billingId: number, transaction?: Transaction) =>
  paymentReceivedModel.findAll({
    where: { billing_id: billingId },
    attributes: ["uuid", "transition_id", "amount_received", "created_at"],
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
    ...(transaction ? { transaction } : {}),
  });

const getBillingAmounts = async (billing: IBillingSchema, transaction?: Transaction) => {
  const [transitions, payments] = await Promise.all([
    getApprovedTransitionsForBilling(billing, transaction),
    getPaymentRows(billing.id, transaction),
  ]);
  const totalCents = transitions.reduce((sum, item) => sum + toCents(item.total_price), 0);
  const paidCents = payments.reduce((sum, item) => sum + toCents(item.amount_received), 0);
  return { transitions, payments, totalCents, paidCents };
};

const toPublicBilling = async (billing: IBillingSchema): Promise<IBillingPublic> => {
  const [{ transitions, payments, totalCents, paidCents }, customer, customerBusiness, business] =
    await Promise.all([
      getBillingAmounts(billing),
      userModel.findByPk(billing.customer_id, {
        attributes: ["uuid", "first_name", "last_name", "username"],
      }),
      billing.customer_business_id
        ? businessModel.findByPk(billing.customer_business_id, { attributes: ["uuid", "name"] })
        : null,
      businessModel.findByPk(billing.business_id, { attributes: ["uuid", "name"] }),
    ]);
  const transitionsById = new Map(transitions.map((transition) => [transition.id, transition]));
  const outstandingCents = Math.max(totalCents - paidCents, 0);
  const paymentStatus =
    totalCents > 0 && outstandingCents === 0 ? "paid" : paidCents > 0 ? "partial" : "unpaid";

  return {
    uuid: billing.uuid,
    current_outstanding: fromCents(outstandingCents),
    total_amount: fromCents(totalCents),
    amount_received: fromCents(paidCents),
    payment_status: paymentStatus,
    start_date_of_month: billing.start_date_of_month,
    end_date_of_month: billing.end_date_of_month,
    due_date: billing.due_date,
    extend_due_date: billing.extend_due_date,
    generated_at: billing.generated_at,
    created_at: billing.created_at,
    updated_at: billing.updated_at,
    customer: customer
      ? {
          uuid: customer.uuid,
          first_name: customer.first_name,
          last_name: customer.last_name,
          username: customer.username,
        }
      : null,
    customer_business: customerBusiness
      ? { uuid: customerBusiness.uuid, name: customerBusiness.name }
      : null,
    business: business ? { uuid: business.uuid, name: business.name } : null,
    payments: payments.map((payment) => {
      const transition = transitionsById.get(payment.transition_id);
      return {
        uuid: payment.uuid,
        transition_uuid: transition?.uuid ?? "",
        product_name: transition?.product_name ?? "Transition",
        amount_received: Number(payment.amount_received),
        created_at: payment.created_at,
      };
    }),
  };
};

export const findBillings = async (
  currentUserId: number,
  options: IBillingListOptions,
  businessUuid?: string,
): Promise<IBillingPage | undefined> => {
  let where: WhereOptions<IBillingSchema> = {
    [Op.or]: [{ customer_id: currentUserId }, { business_owner_id: currentUserId }],
  };

  if (businessUuid) {
    const business = await businessModel.findOne({
      where: { uuid: businessUuid, created_by: currentUserId },
      attributes: ["id"],
    });
    if (!business) return undefined;
    where = {
      [Op.or]: [
        { business_id: business.id, business_owner_id: currentUserId },
        { customer_business_id: business.id, customer_id: currentUserId },
      ],
    };
  }

  if (options.year) {
    const startMonth = options.month ?? 1;
    const endYear = options.month === 12 || !options.month ? options.year + 1 : options.year;
    const endMonth = options.month === 12 || !options.month ? 1 : options.month + 1;
    where = {
      ...where,
      start_date_of_month: {
        [Op.gte]: formatDateOnly(options.year, startMonth, 1),
        [Op.lt]: formatDateOnly(endYear, endMonth, 1),
      },
    };
  }

  const { rows, count } = await billingModel.findAndCountAll({
    where,
    ...(options.paginated
      ? { limit: options.limit, offset: (options.page - 1) * options.limit }
      : {}),
    order: [
      ["start_date_of_month", "DESC"],
      ["id", "DESC"],
    ],
  });

  return {
    items: await Promise.all(rows.map((billing) => toPublicBilling(billing.dataValues))),
    total: count,
  };
};

export const findBillingByUuid = async (uuid: string, currentUserId: number) => {
  const billing = await billingModel.findOne({
    where: {
      uuid,
      [Op.or]: [{ customer_id: currentUserId }, { business_owner_id: currentUserId }],
    },
  });
  return billing ? toPublicBilling(billing.dataValues) : undefined;
};

export type RecordBillingPaymentResult =
  | { status: "ok"; billing: IBillingPublic; customerUserId: number }
  | { status: "not_found" | "forbidden" | "invalid_amount" };

export const recordBillingPayment = async (
  uuid: string,
  amount: number,
  currentUserId: number,
): Promise<RecordBillingPaymentResult> => {
  const result = await sequelize.transaction(async (transaction) => {
    const billing = await billingModel.findOne({
      where: { uuid },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!billing) return { status: "not_found" } as const;
    if (billing.business_owner_id !== currentUserId) {
      return { status: "forbidden" } as const;
    }

    const { transitions, payments, totalCents, paidCents } = await getBillingAmounts(
      billing.dataValues,
      transaction,
    );
    const requestedCents = toCents(amount);
    const outstandingCents = Math.max(totalCents - paidCents, 0);
    if (requestedCents <= 0 || requestedCents > outstandingCents) {
      return { status: "invalid_amount" } as const;
    }

    const paidByTransition = new Map<number, number>();
    payments.forEach((payment) => {
      paidByTransition.set(
        payment.transition_id,
        (paidByTransition.get(payment.transition_id) ?? 0) + toCents(payment.amount_received),
      );
    });

    let remainingPayment = requestedCents;
    for (const transition of transitions) {
      if (remainingPayment <= 0) break;
      const transitionRemaining = Math.max(
        toCents(transition.total_price) - (paidByTransition.get(transition.id) ?? 0),
        0,
      );
      if (transitionRemaining <= 0) continue;
      const allocation = Math.min(transitionRemaining, remainingPayment);
      await paymentReceivedModel.create(
        {
          billing_id: billing.id,
          transition_id: transition.id,
          amount_received: fromCents(allocation),
          created_by: currentUserId,
        },
        { transaction },
      );
      remainingPayment -= allocation;
    }

    if (remainingPayment !== 0) throw new Error("Payment allocation did not balance.");
    await billing.update(
      {
        current_outstanding: fromCents(outstandingCents - requestedCents),
        updated_by: currentUserId,
      },
      { transaction },
    );
    return { status: "ok", billingId: billing.id } as const;
  });

  if (result.status !== "ok") return result;
  const billing = await billingModel.findByPk(result.billingId);
  if (!billing) return { status: "not_found" };
  return {
    status: "ok",
    billing: await toPublicBilling(billing.dataValues),
    customerUserId: billing.customer_id,
  };
};

export const extendBillingDueDate = async (
  uuid: string,
  extendDueDate: string,
  currentUserId: number,
) => {
  const billing = await billingModel.findOne({ where: { uuid } });
  if (!billing) return { status: "not_found" } as const;
  if (billing.business_owner_id !== currentUserId) return { status: "forbidden" } as const;
  if (!billing.generated_at) return { status: "not_generated" } as const;
  if (extendDueDate <= billing.due_date) return { status: "invalid_date" } as const;
  await billing.update({
    extend_due_date: extendDueDate,
    updated_by: currentUserId,
  });
  return { status: "ok", billing: await toPublicBilling(billing.dataValues) } as const;
};

export const generateBilling = async (uuid: string, dueDate: string, currentUserId: number) => {
  const billing = await billingModel.findOne({ where: { uuid } });
  if (!billing) return { status: "not_found" } as const;
  if (billing.business_owner_id !== currentUserId) return { status: "forbidden" } as const;
  if (dueDate < billing.end_date_of_month) return { status: "invalid_date" } as const;

  await billing.update({
    due_date: dueDate,
    extend_due_date: null,
    generated_at: new Date(),
    updated_by: currentUserId,
  });
  return { status: "ok", billing: await toPublicBilling(billing.dataValues) } as const;
};
