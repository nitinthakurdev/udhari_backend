import { organizationModel } from "@/models/organizationModel";
import { userModel } from "@/models/userModel";
import type {
  IOrganizationCreatePayload,
  IOrganizationPublic,
  IOrganizationSchema,
  IOrganizationUpdateData,
} from "@/types/organizationTypes";
import { Op } from "sequelize";

const organizationAttributes: string[] = [
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

const toPublicOrganization = (organization: IOrganizationSchema): IOrganizationPublic => ({
  uuid: organization.uuid,
  name: organization.name,
  slug: organization.slug,
  country: organization.country,
  state: organization.state,
  city: organization.city,
  address: organization.address,
  address_2: organization.address_2,
  created_at: organization.created_at,
  updated_at: organization.updated_at,
});

/*
==============================================================================
********************** create organization service here **********************
==============================================================================
 */
export const createOrganization = async (
  data: IOrganizationCreatePayload,
): Promise<IOrganizationSchema> => {
  const result = await organizationModel.create(data);
  return result.dataValues;
};

/*
==============================================================================
********************** list organizations service here ***********************
==============================================================================
 */
export const findOrganizationsByCreator = async (
  createdBy: number,
): Promise<IOrganizationPublic[]> => {
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
export const findOrganizationWithNameAndSlug = async (
  name: string,
  slug: string,
  excludeUuid?: string,
): Promise<IOrganizationPublic | undefined> => {
  const result = await organizationModel.findOne({
    where: {
      [Op.or]: [{ name }, { slug }],
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: organizationAttributes,
  });
  return result?.dataValues;
};

/*
==============================================================================
********************** update organization service **************************
==============================================================================
 */
export const updateOrganizationByUuid = async (
  uuid: string,
  createdBy: number,
  data: IOrganizationUpdateData,
): Promise<IOrganizationPublic | undefined> => {
  const organization = await organizationModel.findOne({
    where: { uuid, created_by: createdBy },
  });

  if (!organization) return undefined;

  const updatedOrganization = await organization.update(data);
  return toPublicOrganization(updatedOrganization.dataValues);
};

/*
==============================================================================
********************** set default organization *****************************
==============================================================================
 */
export const setDefaultOrganizationByUuid = async (
  uuid: string,
  userId: number,
): Promise<IOrganizationPublic | undefined> => {
  const organization = await organizationModel.findOne({
    where: { uuid, created_by: userId },
  });

  if (!organization) return undefined;

  await userModel.update(
    { organization_id: organization.id },
    { where: { id: userId } },
  );

  return toPublicOrganization(organization.dataValues);
};
