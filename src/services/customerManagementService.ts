import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";
import type {
  ICustomerSearchResult,
  ICustomerManagementCreateData,
  ICustomerManagementUpdateData,
} from "@/types/customerManagementTypes";
import { sequelize } from "@/config/dbConfig";
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

export const searchCustomersForBusiness = async (
  searchKey: string,
  businessOwnerId: number,
  businessUuid: string,
): Promise<ICustomerSearchResult[] | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid, created_by: businessOwnerId },
    attributes: ["id"],
  });

  if (!business) return undefined;

  const escapedSearchKey = searchKey.replace(/[\\%_]/g, "\\$&");
  const nameSearch = sequelize.where(
    sequelize.fn(
      "concat",
      sequelize.col("first_name"),
      " ",
      sequelize.fn("coalesce", sequelize.col("last_name"), ""),
    ),
    { [Op.iLike]: `%${escapedSearchKey}%` },
  );

  const users = await userModel.findAll({
    where: {
      id: { [Op.ne]: businessOwnerId },
      [Op.or]: [
        nameSearch,
        { username: { [Op.iLike]: `%${escapedSearchKey}%` } },
        { email: { [Op.iLike]: `%${escapedSearchKey}%` } },
        { phone: { [Op.iLike]: `%${escapedSearchKey}%` } },
      ],
    },
    attributes: ["id", ...userAttributes],
    order: [
      ["first_name", "ASC"],
      ["last_name", "ASC"],
    ],
    limit: 10,
    raw: true,
  });

  return users.map((user) => ({
    uuid: user.uuid,
    user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    dial_code: user.dial_code,
  }));
};

export const getCustomerConnectionReferences = async (
  userId: number,
  businessUuid: string,
  businessOwnerId: number,
) => {
  const [user, business] = await Promise.all([
    userModel.findByPk(userId, { attributes: ["id"] }),
    businessModel.findOne({
      where: { uuid: businessUuid, created_by: businessOwnerId },
      attributes: ["id"],
    }),
  ]);

  return { user, business };
};

export const deleteCustomerConnectionByBusinessOwner = async (
  uuid: string,
  businessOwnerId: number,
): Promise<boolean> => {
  const customer = await customerManagementModel.findOne({
    where: { uuid, connect_user_id: businessOwnerId },
  });

  if (!customer) return false;

  await customer.update({ deleted_by: businessOwnerId });
  await customer.destroy();
  return true;
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
