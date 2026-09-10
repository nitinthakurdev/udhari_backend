import { businessModel } from "@/models/businessModel";
import { userModel } from "@/models/userModel";
import type {
  IBusinessCreatePayload,
  IBusinessPublic,
  IBusinessSchema,
  IBusinessUpdateData,
} from "@/types/businessTypes";
import { Op } from "sequelize";
import { sequelize } from "@/config/dbConfig";

const businessAttributes: string[] = [
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
];

const toPublicBusiness = (business: IBusinessSchema): IBusinessPublic => ({
  uuid: business.uuid,
  name: business.name,
  slug: business.slug,
  country: business.country,
  state: business.state,
  city: business.city,
  pincode: business.pincode,
  address: business.address,
  address_2: business.address_2,
  created_at: business.created_at,
  updated_at: business.updated_at,
});

/*
==============================================================================
********************** create business service here **********************
==============================================================================
 */
export const createBusiness = async (data: IBusinessCreatePayload): Promise<IBusinessSchema> => {
  const result = await businessModel.create(data);
  return result.dataValues;
};

/*
==============================================================================
********************** list businesses service here ***********************
==============================================================================
 */
export const findBusinessesByCreator = async (createdBy: number): Promise<IBusinessPublic[]> => {
  const results = await businessModel.findAll({
    where: { created_by: createdBy },
    attributes: businessAttributes,
    order: [["created_at", "DESC"]],
  });

  return results;
};

/*
==============================================================================
******************** find business with name and slug ********************
==============================================================================
 */
export const findBusinessWithNameAndSlug = async (
  name: string,
  slug: string,
  excludeUuid?: string,
): Promise<IBusinessPublic | undefined> => {
  const result = await businessModel.findOne({
    where: {
      [Op.or]: [{ name }, { slug }],
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: businessAttributes,
  });
  return result?.dataValues;
};

/*
==============================================================================
********************** update business service **************************
==============================================================================
 */
export const updateBusinessByUuid = async (
  uuid: string,
  createdBy: number,
  data: IBusinessUpdateData,
): Promise<IBusinessPublic | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid, created_by: createdBy },
  });

  if (!business) return undefined;

  const updatedBusiness = await business.update(data);
  return toPublicBusiness(updatedBusiness.dataValues);
};

/*
==============================================================================
********************** set default business *****************************
==============================================================================
 */
export const setDefaultBusinessByUuid = async (
  uuid: string,
  userId: number,
): Promise<IBusinessPublic | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid, created_by: userId },
  });

  if (!business) return undefined;

  await userModel.update({ business_id: business.id }, { where: { id: userId } });

  return toPublicBusiness(business.dataValues);
};

export const deleteBusinessByUuid = async (uuid: string, userId: number): Promise<boolean> =>
  sequelize.transaction(async (transaction) => {
    const business = await businessModel.findOne({
      where: { uuid, created_by: userId },
      transaction,
    });

    if (!business) return false;

    await userModel.update(
      { business_id: null },
      { where: { business_id: business.id }, transaction },
    );
    await business.update({ deleted_by: userId }, { transaction });
    await business.destroy({ transaction });
    return true;
  });
