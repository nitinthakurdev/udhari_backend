import { organizationModel } from "@/models/organizationModel";
import type { IOrganizationCreatePayload, IOrganizationPublic } from "@/types/organizationTypes";
import { Op } from "sequelize";

/*
==============================================================================
********************** create organization service here **********************
==============================================================================
 */
export const createOrganization = async (data: IOrganizationCreatePayload) => {
  const result = await organizationModel.create(data);
  return result.dataValues;
};

/*
==============================================================================
********************** list organizations service here ***********************
==============================================================================
 */
export const findOrganizationsByCreator = async (createdBy: number): Promise<IOrganizationPublic[]> => {
  const results = await organizationModel.findAll({
    where: { created_by: createdBy },
    attributes: [
      "uuid",
      "name",
      "slug",
      "country",
      "state",
      "city",
      "address",
      "address_2",
      "created_at",
      "updated_at",
    ],
    order: [["created_at", "DESC"]],
  }) ;

  return results;
};

/*
==============================================================================
******************** find organization with name and slug ********************
==============================================================================
 */
export const findOrganizationWithNameAndSlug = async (name: string, slug: string) => {
  const result = await organizationModel.findOne({
    where: {
      [Op.or]: [{ name }, { slug }],
    },
  });
  return result?.dataValues;
};
