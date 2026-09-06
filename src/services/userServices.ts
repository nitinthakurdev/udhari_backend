import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";
import type { ICurrentUser, IUserCreateData, IUserPublic, IUserSchema } from "@/types/userTypes";
import { Op } from "sequelize";

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
});


/*
==============================================================================
********************** all the user related includes here ********************
==============================================================================
 */

const roleInclude = {
  model: roleModel,
  as: "user_role",
  attributes: ["uuid", "name", "slug", "created_at"]
}

/*
==============================================================================
********************** create user service here ******************************
==============================================================================
 */
export const createUser = async (data: IUserCreateData): Promise<IUserPublic> => {
  const result = await userModel.create(data);
  return toPublicUser(result.dataValues);
};

/*
==============================================================================
***************** find by email or username user service here ****************
==============================================================================
 */
export const findUserByEmailOrUsername = async (email: string, username: string) => {
  const result = await userModel.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  return result?.dataValues;
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
    include: [roleInclude],
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
      "created_at",
    ],
  });

  return result?.dataValues;
};
