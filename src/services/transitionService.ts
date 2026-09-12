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
  "user_id",
  "business_id",
  "unit_id",
  "product_name",
  "product_qty",
  "product_price",
  "total_price",
  "status",
  "approved_by_user",
  "approved_by_business",
  "comment",
  "created_at",
  "updated_at",
];

const toPublicTransition = (transition: ITransitionSchema): ITransitionPublic => ({
  uuid: transition.uuid,
  user_id: transition.user_id,
  business_id: transition.business_id,
  unit_id: transition.unit_id,
  product_name: transition.product_name,
  product_qty: transition.product_qty,
  product_price: Number(transition.product_price),
  total_price: Number(transition.total_price),
  status: transition.status,
  approved_by_user: transition.approved_by_user,
  approved_by_business: transition.approved_by_business,
  comment: transition.comment,
  created_at: transition.created_at,
  updated_at: transition.updated_at,
});

const getAccessibleWhere = async (
  currentUserId: number,
): Promise<WhereOptions<ITransitionSchema>> => {
  const businesses = await businessModel.findAll({
    where: { created_by: currentUserId },
    attributes: ["id"],
    raw: true,
  });

  return {
    [Op.or]: [
      { user_id: currentUserId },
      { business_id: { [Op.in]: businesses.map((business) => business.id) } },
    ],
  };
};

export const checkTransitionAccess = async (
  userId: number,
  businessId: number,
  currentUserId: number,
): Promise<ITransitionAccess> => {
  const [user, business] = await Promise.all([
    userModel.findByPk(userId, { attributes: ["id"] }),
    businessModel.findByPk(businessId, { attributes: ["id", "created_by"] }),
  ]);
  const businessOwnerId = business?.created_by ?? null;
  const connection =
    user && businessOwnerId
      ? await customerManagementModel.findOne({
          where: {
            created_by: userId,
            connect_user_id: businessOwnerId,
            business_id: businessId,
          },
          attributes: ["id"],
        })
      : null;

  return {
    userExists: Boolean(user),
    businessExists: Boolean(business),
    connectionExists: Boolean(connection),
    canAccess: currentUserId === userId || currentUserId === businessOwnerId,
    isUser: currentUserId === userId,
    isBusinessOwner: currentUserId === businessOwnerId,
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
  return toPublicTransition(transition.dataValues);
};

export const findTransitions = async (currentUserId: number): Promise<ITransitionPublic[]> => {
  const where = await getAccessibleWhere(currentUserId);
  const transitions = await transitionsModel.findAll({
    where,
    attributes: transitionAttributes,
    order: [["created_at", "DESC"]],
  });

  return transitions.map((transition) => toPublicTransition(transition.dataValues));
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
    where: { business_id: business.id },
    attributes: transitionAttributes,
    order: [["created_at", "DESC"]],
  });

  return transitions.map((transition) => toPublicTransition(transition.dataValues));
};

export const findTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
): Promise<ITransitionPublic | undefined> => {
  const accessWhere = await getAccessibleWhere(currentUserId);
  const transition = await transitionsModel.findOne({
    where: { uuid, [Op.and]: [accessWhere] },
    attributes: transitionAttributes,
  });

  return transition ? toPublicTransition(transition.dataValues) : undefined;
};

export const updateTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
  data: ITransitionUpdateData,
): Promise<ITransitionPublic | undefined> => {
  const accessWhere = await getAccessibleWhere(currentUserId);
  const transition = await transitionsModel.findOne({
    where: { uuid, [Op.and]: [accessWhere] },
  });

  if (!transition) return undefined;

  const updatedTransition = await transition.update(data);
  return toPublicTransition(updatedTransition.dataValues);
};

export const deleteTransitionByUuid = async (
  uuid: string,
  currentUserId: number,
): Promise<boolean> => {
  const accessWhere = await getAccessibleWhere(currentUserId);
  const transition = await transitionsModel.findOne({
    where: { uuid, [Op.and]: [accessWhere] },
  });

  if (!transition) return false;

  await transition.update({ deleted_by: currentUserId });
  await transition.destroy();
  return true;
};
