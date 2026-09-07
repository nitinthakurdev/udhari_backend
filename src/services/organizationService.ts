import { organizationModel } from "@/models/organizationModel";
import type { IOrganizationCreatePayload, IOrganizationPublic, IOrganizationSchema } from "@/types/organizationTypes";
import { Op } from "sequelize";


const organizationAttributes:string[] = [
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
];

/*
==============================================================================
********************** create organization service here **********************
==============================================================================
 */
export const createOrganization = async (data: IOrganizationCreatePayload): Promise<IOrganizationSchema> => {
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
    attributes: organizationAttributes,
    order: [["created_at", "DESC"]],
  });

  return results;
};

/*
==============================================================================
******************** find organization with name and slug ********************
==============================================================================
 */
export const findOrganizationWithNameAndSlug = async (name: string, slug: string):Promise<IOrganizationPublic | undefined> => {
  const result = await organizationModel.findOne({
    where: {
      [Op.or]: [{ name }, { slug }],
    },
    attributes:organizationAttributes,
  });
  return result?.dataValues;
};
