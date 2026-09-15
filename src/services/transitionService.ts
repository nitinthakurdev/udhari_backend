import { sequelize } from "@/config/dbConfig";
import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { transitionsModel } from "@/models/transitionModel";
import { paymentReceivedModel } from "@/models/paymentReceivedModel";
import { userModel } from "@/models/userModel";
import { unitModel } from "@/models/unitModel";
import { findAdminUserIds } from "@/services/unitService";
import { addTransitionToOutstanding, ensureMonthlyBilling } from "@/services/billingService";
import type {
  ITransitionAccess,
  ITransitionBalanceSummary,
  ITransitionCreateData,
  ITransitionListOptions,
  ITransitionPage,
  ITransitionPublic,
  ITransitionSchema,
  ITransitionUpdateData,
} from "@/types/transitionTypes";
import { fn, col, literal, Op, type WhereOptions } from "sequelize";

const transitionAttributes = [
  "id",
  "uuid",
  "customer_user_id",
  "customer_business_id",
  "business_id",
  "business_user_id",
  "unit_id",
  "product_name",
  "product_qty",
  "product_unit_price",
  "total_price",
  "request_status",
  "balance_type",
  "comment",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
];

const transitionUnitInclude = {
  model: unitModel,
  as: "unit",
  attributes: ["name", "code"],
  required: false,
};

type TransitionWithUnit = ITransitionSchema & {
  unit?: { name: string; code: string } | null;
};

const inverseBalanceType = (balanceType: ITransitionSchema["balance_type"]) =>
  balanceType === "payable" ? "receivable" : "payable";

const toPublicTransition = (
  transition: TransitionWithUnit,
  currentUserId: number,
  paidAmount = 0,
): ITransitionPublic => ({
  uuid: transition.uuid,
  customer_user_id: transition.customer_user_id,
  customer_business_id: transition.customer_business_id,
  business_id: transition.business_id,
  business_user_id: transition.business_user_id,
  unit_id: transition.unit_id,
  product_name: transition.product_name,
  product_qty: Number(transition.product_qty),
  product_unit_price: Number(transition.product_unit_price),
  total_price: Number(transition.total_price),
  paid_amount: paidAmount,
  outstanding_amount: Math.max(Number(transition.total_price) - paidAmount, 0),
  payment_status:
    paidAmount >= Number(transition.total_price) ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
  request_status: transition.request_status,
  balance_type: transition.balance_type,
  account_type:
    transition.customer_user_id === currentUserId
      ? transition.balance_type
      : inverseBalanceType(transition.balance_type),
  comment: transition.comment,
  created_by: transition.created_by,
  updated_by: transition.updated_by,
  created_at: transition.created_at,
  updated_at: transition.updated_at,
  unit: transition.unit ? { name: transition.unit.name, code: transition.unit.code } : null,
});

const getAccessibleWhere = (currentUserId: number): WhereOptions<ITransitionSchema> => {
  return {
    [Op.or]: [{ customer_user_id: currentUserId }, { business_user_id: currentUserId }],
  };
};

const getViewWhere = (
  view: ITransitionListOptions["view"],
  currentUserId: number,
): WhereOptions<ITransitionSchema> => {
  if (view === "pending") {
    return {
      request_status: "pending",
      [Op.or]: [
        { updated_by: { [Op.ne]: currentUserId } },
        {
          updated_by: null,
          created_by: { [Op.ne]: currentUserId },
        },
      ],
    };
  }
  if (view === "unpaid") {
    return {
      request_status: "approved",
      [Op.and]: literal(
        `"TransitionsModel"."total_price" > COALESCE((SELECT SUM("amount_received") FROM "payments_received" WHERE "transition_id" = "TransitionsModel"."id" AND "deleted_at" IS NULL), 0)`,
      ),
    };
  }
  if (view === "cancelled") return { request_status: "cancelled" };
  return {};
};

const getPartyWhere = (
  options: ITransitionListOptions,
  activeBusinessId?: number,
): WhereOptions<ITransitionSchema> => {
  if (!options.partyType || options.partyId === undefined) return {};
  if (options.partyType === "user") {
    return {
      customer_user_id: options.partyId,
      customer_business_id: null,
    };
  }
  if (activeBusinessId === undefined) return { business_id: options.partyId };
  return {
    [Op.or]: [
      {
        customer_business_id: activeBusinessId,
        business_id: options.partyId,
      },
      {
        customer_business_id: options.partyId,
        business_id: activeBusinessId,
      },
    ],
  };
};

const getPaidAmounts = async (transitionIds: number[]) => {
  if (transitionIds.length === 0) return new Map<number, number>();
  const rows = await paymentReceivedModel.findAll({
    where: { transition_id: { [Op.in]: transitionIds } },
    attributes: ["transition_id", [fn("SUM", col("amount_received")), "paid_amount"]],
    group: ["transition_id"],
    raw: true,
  });
  return new Map(
    rows.map((row) => [
      row.transition_id,
      Number((row as unknown as { paid_amount: string }).paid_amount),
    ]),
  );
};

const toPaginationResult = async (
  rows: ITransitionSchema[],
  count: number,
  currentUserId: number,
): Promise<ITransitionPage> => {
  const paidAmounts = await getPaidAmounts(rows.map((transition) => transition.id));
  return {
    items: rows.map((transition) =>
      toPublicTransition(transition, currentUserId, paidAmounts.get(transition.id) ?? 0),
    ),
    total: count,
  };
};

const summarizeTransitions = (
  transitions: ITransitionSchema[],
  currentUserId: number,
  paidAmounts: Map<number, number>,
): ITransitionBalanceSummary => {
  const summary: ITransitionBalanceSummary = {
    payable: 0,
    receivable: 0,
    parties: [],
  };
  const grouped = new Map<string, ITransitionBalanceSummary["parties"][number]>();

  transitions.forEach((transition) => {
    const accountType =
      transition.customer_user_id === currentUserId
        ? transition.balance_type
        : inverseBalanceType(transition.balance_type);
    const currentIsCustomer = transition.customer_user_id === currentUserId;
    const partyType =
      transition.customer_business_id === null && !currentIsCustomer ? "user" : "business";
    const partyId =
      partyType === "user"
        ? transition.customer_user_id
        : currentIsCustomer
          ? transition.business_id
          : (transition.customer_business_id ?? transition.business_id);
    const amount = Math.max(
      Number(transition.total_price) - (paidAmounts.get(transition.id) ?? 0),
      0,
    );
    const key = `${partyType}:${String(partyId)}:${accountType}`;
    const existing = grouped.get(key);

    summary[accountType] += amount;
    grouped.set(key, {
      party_type: partyType,
      party_id: partyId,
      account_type: accountType,
      amount: (existing?.amount ?? 0) + amount,
    });
  });

  summary.parties = [...grouped.values()];
  return summary;
};

export const checkTransitionAccess = async (
  customerUserId: number,
  businessId: number,
  currentUserId: number,
): Promise<ITransitionAccess> => {
  const [customer, business] = await Promise.all([
    userModel.findByPk(customerUserId, { attributes: ["id"] }),
    businessModel.findByPk(businessId, { attributes: ["id", "created_by"] }),
  ]);
  const businessOwnerId = business?.created_by ?? null;
  const connection =
    customer && businessOwnerId
      ? await customerManagementModel.findOne({
          where: {
            business_id: businessId,
            request_status: "approved",
            [Op.or]: [
              {
                created_by: customerUserId,
                connect_user_id: businessOwnerId,
                role: "customer",
              },
              {
                created_by: businessOwnerId,
                connect_user_id: customerUserId,
                role: "business",
              },
            ],
          },
          attributes: ["id"],
        })
      : null;

  return {
    customerExists: Boolean(customer),
    businessExists: Boolean(business),
    businessUserId: businessOwnerId,
    connectionExists: Boolean(connection),
    canAccess: currentUserId === customerUserId || currentUserId === businessOwnerId,
    isCustomer: currentUserId === customerUserId,
    isBusinessOwner: currentUserId === businessOwnerId,
  };
};

export const checkBusinessTransitionAccess = async (
  sourceBusinessUuid: string,
  targetBusinessId: number,
  currentUserId: number,
) => {
  const [sourceBusiness, targetBusiness] = await Promise.all([
    businessModel.findOne({
      where: { uuid: sourceBusinessUuid, created_by: currentUserId },
      attributes: ["id", "created_by"],
    }),
    businessModel.findByPk(targetBusinessId, {
      attributes: ["id", "created_by"],
    }),
  ]);
  const targetOwnerId = targetBusiness?.created_by ?? null;
  const connection =
    sourceBusiness && targetOwnerId && targetOwnerId !== currentUserId
      ? await customerManagementModel.findOne({
          where: {
            request_status: "approved",
            source_business_id: { [Op.not]: null },
            [Op.or]: [
              {
                source_business_id: sourceBusiness.id,
                business_id: targetBusinessId,
              },
              {
                source_business_id: targetBusinessId,
                business_id: sourceBusiness.id,
              },
            ],
          },
          attributes: ["id"],
        })
      : null;

  return {
    sourceBusinessId: sourceBusiness?.id ?? null,
    targetBusinessExists: Boolean(targetBusiness),
    targetOwnerId,
    connectionExists: Boolean(connection),
  };
};

export const isUnitAvailableForBusiness = async (
  unitId: number,
  businessId: number,
): Promise<boolean> => {
  const business = await businessModel.findByPk(businessId, {
    attributes: ["created_by"],
  });
  if (!business?.created_by) return false;

  const adminUserIds = await findAdminUserIds();
  const unit = await unitModel.findOne({
    where: {
      id: unitId,
      created_by: { [Op.in]: [business.created_by, ...adminUserIds] },
    },
    attributes: ["id"],
  });

  return Boolean(unit);
};

export const createTransition = async (data: ITransitionCreateData): Promise<ITransitionPublic> =>
  sequelize.transaction(async (transaction) => {
    const transition = await transitionsModel.create(data, { transaction });
    await ensureMonthlyBilling(data, transaction, transition.created_at);
    return toPublicTransition(transition.dataValues, data.created_by);
  });

export const createTransitions = async (
  data: ITransitionCreateData[],
): Promise<ITransitionPublic[]> =>
  sequelize.transaction(async (transaction) => {
    const transitions = await transitionsModel.bulkCreate(data, {
      returning: true,
      transaction,
    });
    const billingGroups = new Map<string, ITransitionCreateData>();
    data.forEach((item) => {
      billingGroups.set(`${String(item.customer_user_id)}:${String(item.business_id)}`, item);
    });
    await Promise.all(
      [...billingGroups.values()].map((item) => ensureMonthlyBilling(item, transaction)),
    );
    return transitions.map((transition) =>
      toPublicTransition(transition.dataValues, transition.created_by ?? 0),
    );
  });

export const findTransitions = async (
  currentUserId: number,
  options: ITransitionListOptions,
): Promise<ITransitionPage> => {
  const { rows, count } = await transitionsModel.findAndCountAll({
    where: {
      [Op.and]: [
        getAccessibleWhere(currentUserId),
        getViewWhere(options.view, currentUserId),
        getPartyWhere(options),
      ],
    },
    attributes: transitionAttributes,
    include: [transitionUnitInclude],
    ...(options.paginated
      ? {
          limit: options.limit,
          offset: (options.page - 1) * options.limit,
        }
      : {}),
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  return await toPaginationResult(
    rows.map((transition) => transition.dataValues),
    count,
    currentUserId,
  );
};

export const findTransitionsForBusiness = async (
  businessUuid: string,
  businessOwnerId: number,
  options: ITransitionListOptions,
): Promise<ITransitionPage | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid, created_by: businessOwnerId },
    attributes: ["id"],
  });

  if (!business) return undefined;

  const { rows, count } = await transitionsModel.findAndCountAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ business_id: business.id }, { customer_business_id: business.id }],
        },
        getViewWhere(options.view, businessOwnerId),
        getPartyWhere(options, business.id),
      ],
    },
    attributes: transitionAttributes,
    include: [transitionUnitInclude],
    ...(options.paginated
      ? {
          limit: options.limit,
          offset: (options.page - 1) * options.limit,
        }
      : {}),
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  return await toPaginationResult(
    rows.map((transition) => transition.dataValues),
    count,
    businessOwnerId,
  );
};

export const getTransitionBalanceSummary = async (
  currentUserId: number,
): Promise<ITransitionBalanceSummary> => {
  const transitions = await transitionsModel.findAll({
    where: {
      [Op.and]: [getAccessibleWhere(currentUserId), { request_status: "approved" }],
    },
    attributes: [
      "id",
      "customer_user_id",
      "customer_business_id",
      "business_id",
      "balance_type",
      "total_price",
    ],
  });

  const values = transitions.map((transition) => transition.dataValues);
  return summarizeTransitions(
    values,
    currentUserId,
    await getPaidAmounts(values.map((transition) => transition.id)),
  );
};

export const getTransitionBalanceSummaryForBusiness = async (
  businessUuid: string,
  businessOwnerId: number,
): Promise<ITransitionBalanceSummary | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid, created_by: businessOwnerId },
    attributes: ["id"],
  });
  if (!business) return undefined;

  const transitions = await transitionsModel.findAll({
    where: {
      request_status: "approved",
      [Op.or]: [{ business_id: business.id }, { customer_business_id: business.id }],
    },
    attributes: [
      "id",
      "customer_user_id",
      "customer_business_id",
      "business_id",
      "balance_type",
      "total_price",
    ],
  });

  const values = transitions.map((transition) => transition.dataValues);
  return summarizeTransitions(
    values,
    businessOwnerId,
    await getPaidAmounts(values.map((transition) => transition.id)),
  );
};

export const findTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
): Promise<ITransitionPublic | undefined> => {
  const accessWhere = getAccessibleWhere(currentUserId);
  const transition = await transitionsModel.findOne({
    where: { uuid, [Op.and]: [accessWhere] },
    attributes: transitionAttributes,
    include: [transitionUnitInclude],
  });

  if (!transition) return undefined;
  const paidAmounts = await getPaidAmounts([transition.id]);
  return toPublicTransition(
    transition.dataValues,
    currentUserId,
    paidAmounts.get(transition.id) ?? 0,
  );
};

export const updateTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
  data: ITransitionUpdateData,
): Promise<ITransitionPublic | undefined> => {
  return sequelize.transaction(async (transaction) => {
    const accessWhere = getAccessibleWhere(currentUserId);
    const transition = await transitionsModel.findOne({
      where: { uuid, [Op.and]: [accessWhere] },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!transition) return undefined;
    const becameApproved =
      transition.request_status !== "approved" && data.request_status === "approved";
    const updatedTransition = await transition.update(data, { transaction });
    if (becameApproved) {
      await addTransitionToOutstanding(updatedTransition.dataValues, currentUserId, transaction);
    }
    const paidAmounts = await getPaidAmounts([updatedTransition.id]);
    return toPublicTransition(
      updatedTransition.dataValues,
      currentUserId,
      paidAmounts.get(updatedTransition.id) ?? 0,
    );
  });
};
