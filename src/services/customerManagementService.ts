import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";
import type {
  ICustomerManagementCreateData,
  ICustomerManagementUpdateData,
} from "@/types/customerManagementTypes";
import { Op } from "sequelize";

const customerAttributes = [
  "uuid",
  "connect_user_id",
  "business_id",
  "created_by",
  "role",
  "created_at",
  "updated_at",
];

const userAttributes = [
  "uuid",
  "first_name",
  "last_name",
  "email",
  "username",
  "phone",
  "dial_code",
];

const customerIncludes = [
  {
    model: userModel,
    as: "connected_user",
    attributes: userAttributes,
  },
  {
    model: userModel,
    as: "creator",
    attributes: userAttributes,
  },
  {
    model: businessModel,
    as: "business",
    attributes: ["uuid", "name", "slug"],
  },
];

export const findCustomerManagementByUuid = async (uuid: string, createdBy: number) =>
  customerManagementModel.findOne({
    where: { uuid, created_by: createdBy },
    attributes: customerAttributes,
    include: customerIncludes,
  });

export const createCustomerManagement = async (data: ICustomerManagementCreateData) => {
  const customer = await customerManagementModel.create(data);
  return findCustomerManagementByUuid(customer.uuid, data.created_by);
};

export const checkTheCustomerAlreadyAdded = async (
  connectUserId: number,
  businessId: number,
  createdBy: number,
  excludeUuid?: string,
) =>
  customerManagementModel.findOne({
    where: {
      connect_user_id: connectUserId,
      business_id: businessId,
      created_by: createdBy,
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: ["uuid"],
  });

export const customerConnectionReferencesExist = async (
  connectUserId: number,
  businessId: number,
): Promise<{ userExists: boolean; businessExists: boolean }> => {
  const [user, business] = await Promise.all([
    userModel.findByPk(connectUserId, { attributes: ["id"] }),
    businessModel.findOne({
      where: { id: businessId, created_by: connectUserId },
      attributes: ["id"],
    }),
  ]);

  return { userExists: Boolean(user), businessExists: Boolean(business) };
};

export const getConnectedUsers = async (createdBy: number) =>
  customerManagementModel.findAll({
    where: { created_by: createdBy },
    attributes: customerAttributes,
    include: customerIncludes,
    order: [["created_at", "DESC"]],
  });

export const getUsersConnectedToBusiness = async (
  businessOwnerId: number,
  businessUuid: string,
) => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid, created_by: businessOwnerId },
    attributes: ["id"],
  });

  if (!business) return undefined;

  return customerManagementModel.findAll({
    where: {
      connect_user_id: businessOwnerId,
      business_id: business.id,
    },
    attributes: customerAttributes,
    include: customerIncludes,
    order: [["created_at", "DESC"]],
  });
};

export const updateCustomerManagementByUuid = async (
  uuid: string,
  createdBy: number,
  data: ICustomerManagementUpdateData,
) => {
  const customer = await customerManagementModel.findOne({
    where: { uuid, created_by: createdBy },
  });

  if (!customer) return undefined;

  await customer.update(data);
  return findCustomerManagementByUuid(uuid, createdBy);
};

export const deleteCustomerManagementByUuid = async (
  uuid: string,
  createdBy: number,
): Promise<boolean> => {
  const customer = await customerManagementModel.findOne({
    where: { uuid, created_by: createdBy },
  });

  if (!customer) return false;

  await customer.update({ deleted_by: createdBy });
  await customer.destroy();
  return true;
};
