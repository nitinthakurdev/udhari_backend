import { userModel } from "@/models/userModel";
import type { IUserCreatePayload, IUserPublic, IUserSchema } from "@/types/userTypes";
import { Op } from "sequelize";

const toPublicUser = (user: IUserSchema): IUserPublic => ({
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
});

export const createUser = async (data: IUserCreatePayload): Promise<IUserPublic> => {
  const result = await userModel.create(data);
  return toPublicUser(result.dataValues);
};

export const findUserByEmailOrUsername = async (email: string, username: string) => {
  const result = await userModel.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  return result?.dataValues;
};
