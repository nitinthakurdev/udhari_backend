import { organizationModel } from "@/models/organizationModel";
import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";
import type { ICurrentUser, IUserAdminListItem, IUserCreateData, IUserPublic, IUserSchema, IUserUpdateSchema } from "@/types/userTypes";
import { Op, type WhereOptions } from "sequelize";

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
  roleInclude : {
    model: roleModel,
    as: "user_role",
    attributes: ["uuid", "name", "slug", "created_at"],
  },
  organizationInclude : {
    model: organizationModel,
    as: "organization",
    attributes: ["uuid", "name", "slug", "country", "state", "city", "pincode", "address", "address_2", "created_at","updated_at"]
  }
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
    include:[includesHandle.roleInclude]
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
    include: [includesHandle.roleInclude,includesHandle.organizationInclude],
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

export const findByIdAndUpdate = async (id: number, data: IUserUpdateSchema): Promise< [affectedCount: number]> => {
  const result = await userModel.update(data,{where:{id}});
  return result;
};


/*
==============================================================================
*************** update user by where service here ***************************
==============================================================================
 */

export const findByIdAndUpdateWhere = async (where: WhereOptions<IUserSchema>, data: IUserUpdateSchema): Promise<[affectedCount: number]> => {
  const result = await userModel.update(data, { where:where });
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
    include: [includesHandle.roleInclude, includesHandle.organizationInclude],
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
      ...(values.organization !== undefined
        ? { organization: values.organization }
        : {}),
    };
  });
};
