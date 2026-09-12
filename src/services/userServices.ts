import { businessModel } from "@/models/businessModel";
import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";
import type {
  ICurrentUser,
  IUserAdminListItem,
  IUserCreateData,
  IUserPublic,
  IUserSchema,
  IUserUniqueField,
  IUserUpdateSchema,
} from "@/types/userTypes";
import { Op, type Transaction, type WhereOptions } from "sequelize";

// ----------- create user data formate handle is here --------------
export const toPublicUser = (user: IUserSchema): IUserPublic => ({
  uuid: user.uuid,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  username: user.username,
  phone: user.phone,
  dial_code: user.dial_code,
  is_email_verified: user.is_email_verified,
  is_phone_verified: user.is_phone_verified,
  score: user.score,
  created_at: user.created_at,
  updated_at: user.updated_at,
  ...(user.user_role ? { user_role: user.user_role } : {}),
});

/*
==============================================================================
********************** all the user related includes here ********************
==============================================================================
 */

const includesHandle = {
  roleInclude: {
    model: roleModel,
    as: "user_role",
    attributes: ["uuid", "name", "slug", "created_at"],
  },
  businessInclude: {
    model: businessModel,
    as: "business",
    attributes: [
      "uuid",
      "name",
      "slug",
      "country",
      "state",
      "city",
      "pincode",
      "address",
      "address_2",
      "created_at",
      "updated_at",
    ],
  },
};

/*
==============================================================================
********************** create user service here ******************************
==============================================================================
 */
export const createUser = async (
  data: IUserCreateData,
  transaction?: Transaction,
): Promise<IUserPublic> => {
  const result = await userModel.create(data, transaction ? { transaction } : {});
  return toPublicUser(result.dataValues);
};

export const verifyUserEmailByToken = async (token: string): Promise<IUserSchema | undefined> => {
  const [affectedCount, updatedUsers] = await userModel.update(
    {
      is_email_verified: true,
      verification_token: null,
      verification_token_expiry: null,
    },
    {
      where: {
        verification_token: token,
        verification_token_expiry: { [Op.gt]: new Date() },
        is_email_verified: false,
      },
      returning: true,
    },
  );

  if (affectedCount !== 1) return undefined;

  return updatedUsers[0]?.dataValues;
};

export const findUserByVerificationToken = async (
  token: string,
): Promise<IUserSchema | undefined> => {
  const result = await userModel.findOne({ where: { verification_token: token } });
  return result?.dataValues;
};

export const findUserByEmail = async (email: string): Promise<IUserSchema | undefined> => {
  const result = await userModel.findOne({ where: { email } });
  return result?.dataValues;
};

export const updateEmailVerificationToken = async (
  id: number,
  token: string,
  expiry: Date,
  transaction?: Transaction,
): Promise<void> => {
  await userModel.update(
    { verification_token: token, verification_token_expiry: expiry },
    { where: { id }, ...(transaction ? { transaction } : {}) },
  );
};

export const updatePasswordResetToken = async (
  id: number,
  tokenHash: string,
  expiry: Date,
  transaction?: Transaction,
): Promise<void> => {
  await userModel.update(
    { password_reset_token: tokenHash, password_reset_token_expiry: expiry },
    { where: { id }, ...(transaction ? { transaction } : {}) },
  );
};

export const resetPasswordByToken = async (
  tokenHash: string,
  password: string,
): Promise<boolean> => {
  const [affectedCount] = await userModel.update(
    {
      password,
      password_reset_token: null,
      password_reset_token_expiry: null,
    },
    {
      where: {
        password_reset_token: tokenHash,
        password_reset_token_expiry: { [Op.gt]: new Date() },
      },
    },
  );

  return affectedCount === 1;
};

/*
==============================================================================
***************** change authenticated user password *************************
==============================================================================
 */
export const changePasswordById = async (id: number, password: string): Promise<boolean> => {
  const [affectedCount] = await userModel.update(
    {
      password,
      password_reset_token: null,
      password_reset_token_expiry: null,
    },
    { where: { id } },
  );

  return affectedCount === 1;
};

/*
==============================================================================
***************** find by email, username, or phone service here *************
==============================================================================
 */
export const findUserByEmailOrUsername = async (email: string, username: string, phone: string) => {
  const users = await userModel.findAll({
    where: { [Op.or]: [{ email }, { username }, { phone }] },
    attributes: ["email", "username", "phone"],
  });

  const conflicts: IUserUniqueField[] = [];
  if (users.some((user) => user.email === email)) conflicts.push("email");
  if (users.some((user) => user.username === username)) conflicts.push("username");
  if (users.some((user) => user.phone === phone)) conflicts.push("phone");

  return conflicts;
};

/*
==============================================================================
***************** find by email or username user service here ****************
==============================================================================
 */
export const findUserByIdentifier = async (
  identifier: string,
): Promise<IUserSchema | undefined> => {
  const result = await userModel.findOne({
    where: { [Op.or]: [{ email: identifier }, { username: identifier }] },
    include: [includesHandle.roleInclude],
  });

  return result?.dataValues;
};

/*
==============================================================================
*************** find user by username service here ***************************
==============================================================================
 */
export const findUserByUsername = async (username: string): Promise<ICurrentUser | undefined> => {
  const result = await userModel.findOne({
    where: { username },
    include: [includesHandle.roleInclude, includesHandle.businessInclude],
    attributes: [
      "id",
      "uuid",
      "first_name",
      "last_name",
      "email",
      "username",
      "phone",
      "dial_code",
      "is_email_verified",
      "is_phone_verified",
      "created_at",
    ],
  });

  return result?.dataValues;
};

/*
==============================================================================
*************** update user by email service here ***************************
==============================================================================
 */

export const findByIdAndUpdate = async (
  id: number,
  data: IUserUpdateSchema,
): Promise<[affectedCount: number]> => {
  const result = await userModel.update(data, { where: { id } });
  return result;
};

/*
==============================================================================
*************** update user by where service here ***************************
==============================================================================
 */

export const findByIdAndUpdateWhere = async (
  where: WhereOptions<IUserSchema>,
  data: IUserUpdateSchema,
): Promise<[affectedCount: number]> => {
  const result = await userModel.update(data, { where: where });
  return result;
};

export const findUsers = async (): Promise<IUserAdminListItem[]> => {
  const users = await userModel.findAll({
    attributes: [
      "uuid",
      "first_name",
      "last_name",
      "email",
      "username",
      "phone",
      "dial_code",
      "is_email_verified",
      "is_phone_verified",
      "score",
      "created_at",
      "updated_at",
    ],
    include: [includesHandle.roleInclude, includesHandle.businessInclude],
    order: [["created_at", "DESC"]],
  });

  return users.map((user) => {
    const values = user.dataValues;

    return {
      uuid: values.uuid,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      username: values.username,
      phone: values.phone,
      dial_code: values.dial_code,
      is_email_verified: values.is_email_verified,
      is_phone_verified: values.is_phone_verified,
      score: values.score,
      created_at: values.created_at,
      updated_at: values.updated_at,
      ...(values.user_role ? { user_role: values.user_role } : {}),
      ...(values.business !== undefined ? { business: values.business } : {}),
    };
  });
};
