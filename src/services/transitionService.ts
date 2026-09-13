import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { transitionsModel } from "@/models/transitionModel";
import { userModel } from "@/models/userModel";
import { unitModel } from "@/models/unitModel";
import { findAdminUserIds } from "@/services/unitService";
import type {
  ITransitionAccess,
  ITransitionCreateData,
  ITransitionPublic,
  ITransitionSchema,
  ITransitionUpdateData,
} from "@/types/transitionTypes";
import { Op, type WhereOptions } from "sequelize";

const transitionAttributes = [
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
  "payment_status",
  "balance_type",
  "comment",
  "created_by",
  "created_at",
  "updated_at",
];

const inverseBalanceType = (balanceType: ITransitionSchema["balance_type"]) =>
  balanceType === "payable" ? "receivable" : "payable";

const toPublicTransition = (
  transition: ITransitionSchema,
  currentUserId: number,
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
  request_status: transition.request_status,
  payment_status: transition.payment_status,
  balance_type: transition.balance_type,
  account_type:
    transition.customer_user_id === currentUserId
      ? transition.balance_type
      : inverseBalanceType(transition.balance_type),
  comment: transition.comment,
  created_by: transition.created_by,
  created_at: transition.created_at,
  updated_at: transition.updated_at,
});

const getAccessibleWhere = (currentUserId: number): WhereOptions<ITransitionSchema> => {
  return {
    [Op.or]: [{ customer_user_id: currentUserId }, { business_user_id: currentUserId }],
  };
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

export const createTransition = async (data: ITransitionCreateData): Promise<ITransitionPublic> => {
  const transition = await transitionsModel.create(data);
  return toPublicTransition(transition.dataValues, data.created_by);
};

export const findTransitions = async (currentUserId: number): Promise<ITransitionPublic[]> => {
  const where = getAccessibleWhere(currentUserId);
  const transitions = await transitionsModel.findAll({
    where,
    attributes: transitionAttributes,
    order: [["created_at", "DESC"]],
  });

  return transitions.map((transition) => toPublicTransition(transition.dataValues, currentUserId));
};

export const findTransitionsForBusiness = async (
  businessUuid: string,
  businessOwnerId: number,
): Promise<ITransitionPublic[] | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid, created_by: businessOwnerId },
    attributes: ["id"],
  });

  if (!business) return undefined;

  const transitions = await transitionsModel.findAll({
    where: {
      [Op.or]: [{ business_id: business.id }, { customer_business_id: business.id }],
    },
    attributes: transitionAttributes,
    order: [["created_at", "DESC"]],
  });

  return transitions.map((transition) =>
    toPublicTransition(transition.dataValues, businessOwnerId),
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
  });

  return transition ? toPublicTransition(transition.dataValues, currentUserId) : undefined;
};

export const updateTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
  data: ITransitionUpdateData,
): Promise<ITransitionPublic | undefined> => {
  const accessWhere = getAccessibleWhere(currentUserId);
  const transition = await transitionsModel.findOne({
    where: { uuid, [Op.and]: [accessWhere] },
  });

  if (!transition) return undefined;

  const updatedTransition = await transition.update(data);
  return toPublicTransition(updatedTransition.dataValues, currentUserId);
};
