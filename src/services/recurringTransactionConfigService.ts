import { businessModel } from "@/models/businessModel";
import { recurringTransactionConfigModel } from "@/models/recurringTransactionConfigModel";
import { unitModel } from "@/models/unitModel";
import { userModel } from "@/models/userModel";
import type {
  IRecurringTransactionConfigPublic,
  IRecurringTransactionConfigSchema,
  IRecurringTransactionConfigUpdatePayload,
  RecurringTransactionType,
} from "@/types/recurringTransactionConfigTypes";
import { Op } from "sequelize";

const includes = [
  {
    model: businessModel,
    as: "business",
    attributes: ["uuid", "name"],
    required: false,
  },
  {
    model: userModel,
    as: "customer",
    attributes: ["id", "uuid", "first_name", "last_name", "username"],
    required: false,
  },
  {
    model: userModel,
    as: "creator",
    attributes: ["id", "uuid", "first_name", "last_name", "username"],
    required: false,
  },
  {
    model: businessModel,
    as: "customer_business",
    attributes: ["uuid", "name"],
    required: false,
  },
  {
    model: unitModel,
    as: "unit",
    attributes: ["id", "uuid", "name", "code"],
    required: false,
  },
];

type ConfigWithRelations = IRecurringTransactionConfigSchema & {
  customer: IRecurringTransactionConfigPublic["customer"];
  creator: IRecurringTransactionConfigPublic["creator"];
  unit: IRecurringTransactionConfigPublic["unit"];
  business: IRecurringTransactionConfigPublic["business"];
  customer_business: IRecurringTransactionConfigPublic["customer_business"];
};

const toPublic = (
  config: ConfigWithRelations,
  currentUserId: number,
): IRecurringTransactionConfigPublic => ({
  id: config.id,
  uuid: config.uuid,
  created_by: config.created_by,
  is_creator: config.created_by === currentUserId,
  type: config.type,
  name: config.name,
  unit_id: config.unit_id,
  quantity: config.quantity === null ? null : Number(config.quantity),
  unit_price: Number(config.unit_price),
  total_price: Number(config.total_price),
  week_days: config.week_days,
  time_ranges: config.time_ranges,
  created_at: config.created_at,
  updated_at: config.updated_at,
  customer: config.customer,
  creator: config.creator,
  business: config.business,
  customer_business: config.customer_business,
  unit: config.unit,
});

const totalPrice = (type: RecurringTransactionType, quantity: number | null, unitPrice: number) =>
  type === "service" ? unitPrice : Number(((quantity ?? 0) * unitPrice).toFixed(2));

const findLoaded = async (uuid: string, ownerId: number) => {
  const config = await recurringTransactionConfigModel.findOne({
    where: { uuid, created_by: ownerId },
    include: includes,
  });
  return config ? toPublic(config.get({ plain: true }) as ConfigWithRelations, ownerId) : undefined;
};

export const listRecurringTransactionConfigs = async (businessId: number, ownerId: number) => {
  const configs = await recurringTransactionConfigModel.findAll({
    where: {
      [Op.or]: [{ business_id: businessId }, { customer_business_id: businessId }],
    },
    include: includes,
    order: [["created_at", "DESC"]],
  });
  return configs.map((config) =>
    toPublic(config.get({ plain: true }) as ConfigWithRelations, ownerId),
  );
};

export const listUserRecurringTransactionConfigs = async (ownerId: number) => {
  const ownedBusinesses = await businessModel.findAll({
    where: { created_by: ownerId },
    attributes: ["id"],
  });
  const businessIds = ownedBusinesses.map((business) => business.id);
  const configs = await recurringTransactionConfigModel.findAll({
    where: {
      [Op.or]: [
        { created_by: ownerId },
        { customer_id: ownerId },
        ...(businessIds.length > 0
          ? [
              { business_id: { [Op.in]: businessIds } },
              { customer_business_id: { [Op.in]: businessIds } },
            ]
          : []),
      ],
    },
    include: includes,
    order: [["created_at", "DESC"]],
  });
  return configs.map((config) =>
    toPublic(config.get({ plain: true }) as ConfigWithRelations, ownerId),
  );
};

export const findRecurringTransactionConfigContext = (uuid: string, ownerId: number) =>
  recurringTransactionConfigModel.findOne({
    where: { uuid, created_by: ownerId },
    attributes: ["business_id"],
  });

export const createRecurringTransactionConfig = async (
  data: Pick<
    IRecurringTransactionConfigSchema,
    | "business_id"
    | "customer_id"
    | "customer_business_id"
    | "type"
    | "name"
    | "unit_id"
    | "quantity"
    | "unit_price"
    | "week_days"
    | "time_ranges"
    | "created_by"
  >,
) => {
  const config = await recurringTransactionConfigModel.create({
    ...data,
    total_price: totalPrice(
      data.type,
      data.quantity === null ? null : Number(data.quantity),
      Number(data.unit_price),
    ),
  });
  return findLoaded(config.uuid, data.created_by ?? 0);
};

export const updateRecurringTransactionConfig = async (
  uuid: string,
  ownerId: number,
  data: IRecurringTransactionConfigUpdatePayload,
) => {
  const config = await recurringTransactionConfigModel.findOne({
    where: { uuid, created_by: ownerId },
  });
  if (!config) return undefined;
  await config.update({
    ...data,
    total_price: totalPrice(data.type, data.quantity, data.unit_price),
    updated_by: ownerId,
  });
  return findLoaded(uuid, ownerId);
};

export const deleteRecurringTransactionConfig = async (uuid: string, ownerId: number) => {
  const config = await recurringTransactionConfigModel.findOne({
    where: { uuid, created_by: ownerId },
  });
  if (!config) return false;
  await config.update({ deleted_by: ownerId });
  await config.destroy();
  return true;
};
