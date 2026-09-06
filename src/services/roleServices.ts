import { roleModel } from "@/models/roleModel";
import type { IRoleCreatePayload, IRolePublic, IRoleSchema } from "@/types/roleTypes";
import { Op } from "sequelize";

export const toPublicRole = (role: IRoleSchema): IRolePublic => ({
  uuid: role.uuid,
  name: role.name,
  slug: role.slug,
  created_at: role.created_at,
  updated_at: role.updated_at,
});

export const createRole = async (data: IRoleCreatePayload): Promise<IRolePublic> => {
  const result = await roleModel.create(data);
  return toPublicRole(result.dataValues);
};

export const findRoleByNameOrSlag = async (
  name: string,
  slug: string,
): Promise<IRoleSchema | undefined> => {
  const result = await roleModel.findOne({
    where: { [Op.or]: [{ name }, { slug }] },
  });

  return result?.dataValues;
};

export const findRoleBySlag = async (slug: string): Promise<IRoleSchema | undefined> => {
  const result = await roleModel.findOne({ where: { slug } });
  return result?.dataValues;
};
