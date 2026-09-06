import { organizationModel } from "@/models/organizationModel";
import type { IOrganizationCreatePayload } from "@/types/organizationTypes";
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
