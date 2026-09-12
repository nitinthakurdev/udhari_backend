import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";
import type {
  ICustomerManagementCreateData,
  ICustomerManagementUpdateData,
  ICustomerSearchResult,
  CustomerRequestStatus,
} from "@/types/customerManagementTypes";
import { sequelize } from "@/config/dbConfig";
import { Op } from "sequelize";

const customerAttributes = [
  "uuid",
  "connect_user_id",
  "request_status",
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
    attributes: ["uuid", "name", "slug", "created_by"],
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
      business_id: businessId,
      [Op.or]: [
        { connect_user_id: connectUserId, created_by: createdBy },
        { connect_user_id: createdBy, created_by: connectUserId },
      ],
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: ["uuid", "request_status"],
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
    where: {
      request_status: "approved",
      [Op.or]: [
        { created_by: createdBy, role: "customer" },
        { connect_user_id: createdBy, role: "business" },
      ],
    },
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
      business_id: business.id,
      request_status: "approved",
      [Op.or]: [
        { connect_user_id: businessOwnerId, role: "customer" },
        { created_by: businessOwnerId, role: "business" },
      ],
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
    where: { uuid },
  });

  if (!customer) return false;

  const business = await businessModel.findOne({
    where: { id: customer.business_id, created_by: businessOwnerId },
    attributes: ["id"],
  });
  if (!business) return false;

  await customer.update({ deleted_by: businessOwnerId });
  await customer.destroy();
  return true;
};

export const getConnectionRequests = async (userId: number) => {
  const where = { request_status: "pending" as const };
  const [incoming, outgoing] = await Promise.all([
    customerManagementModel.findAll({
      where: { ...where, connect_user_id: userId },
      attributes: customerAttributes,
      include: customerIncludes,
      order: [["created_at", "DESC"]],
    }),
    customerManagementModel.findAll({
      where: { ...where, created_by: userId },
      attributes: customerAttributes,
      include: customerIncludes,
      order: [["created_at", "DESC"]],
    }),
  ]);

  return { incoming, outgoing };
};

export const respondToConnectionRequest = async (
  uuid: string,
  userId: number,
  requestStatus: Exclude<CustomerRequestStatus, "pending">,
) => {
  const request = await customerManagementModel.findOne({
    where: { uuid, connect_user_id: userId, request_status: "pending" },
  });

  if (!request) return undefined;

  await request.update({ request_status: requestStatus, updated_by: userId });
  return customerManagementModel.findOne({
    where: { uuid },
    attributes: customerAttributes,
    include: customerIncludes,
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
    where: {
      uuid,
      [Op.or]: [{ created_by: createdBy }, { connect_user_id: createdBy }],
    },
  });

  if (!customer) return false;

  await customer.update({ deleted_by: createdBy });
  await customer.destroy();
  return true;
};
