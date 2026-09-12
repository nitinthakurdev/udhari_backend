import { unitModel } from "@/models/unitModel";
import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";
import type { IUnitCreateData, IUnitPublic, IUnitSchema, IUnitUpdateData } from "@/types/unitTypes";
import { Op, type WhereOptions } from "sequelize";

const unitAttributes = ["id", "uuid", "name", "created_by", "created_at", "updated_at"];

const toPublicUnit = (unit: IUnitSchema, canManage = false): IUnitPublic => ({
  id: unit.id,
  uuid: unit.uuid,
  name: unit.name,
  created_by: unit.created_by,
  created_at: unit.created_at,
  updated_at: unit.updated_at,
  can_manage: canManage,
});

const manageableWhere = (
  uuid: string,
  currentUserId: number,
  isAdmin: boolean,
): WhereOptions<IUnitSchema> => ({
  uuid,
  ...(isAdmin ? {} : { created_by: currentUserId }),
});

export const createUnit = async (data: IUnitCreateData): Promise<IUnitPublic> => {
  const unit = await unitModel.create(data);
  return toPublicUnit(unit.dataValues, true);
};

export const findUnits = async (
  currentUserId: number,
  isAdmin: boolean,
  businessOwnerId?: number,
): Promise<IUnitPublic[]> => {
  const globalCreatorIds = await findAdminUserIds();
  const accessibleCreatorIds = [...globalCreatorIds, ...(businessOwnerId ? [businessOwnerId] : [])];
  const units = await unitModel.findAll({
    ...(isAdmin ? {} : { where: { created_by: { [Op.in]: accessibleCreatorIds } } }),
    attributes: unitAttributes,
    order: [["name", "ASC"]],
  });

  return units.map((unit) =>
    toPublicUnit(unit.dataValues, isAdmin || unit.created_by === currentUserId),
  );
};

export const findUnitByUuid = async (
  uuid: string,
  currentUserId: number,
  isAdmin: boolean,
  businessOwnerId?: number,
): Promise<IUnitPublic | undefined> => {
  const globalCreatorIds = await findAdminUserIds();
  const accessibleCreatorIds = [...globalCreatorIds, ...(businessOwnerId ? [businessOwnerId] : [])];
  const unit = await unitModel.findOne({
    where: {
      uuid,
      ...(isAdmin ? {} : { created_by: { [Op.in]: accessibleCreatorIds } }),
    },
    attributes: unitAttributes,
  });
  return unit
    ? toPublicUnit(unit.dataValues, isAdmin || unit.created_by === currentUserId)
    : undefined;
};

export const findUnitByName = async (
  name: string,
  creatorIds: number[],
  excludeUuid?: string,
): Promise<IUnitPublic | undefined> => {
  const unit = await unitModel.findOne({
    where: {
      name: { [Op.iLike]: name },
      created_by: { [Op.in]: creatorIds },
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: unitAttributes,
  });

  return unit ? toPublicUnit(unit.dataValues) : undefined;
};

export const findAccessibleBusinessOwnerId = async (
  businessUuid: string,
  currentUserId: number,
  roleSlug: string,
): Promise<number | undefined> => {
  const business = await businessModel.findOne({
    where: { uuid: businessUuid },
    attributes: ["id", "created_by"],
  });

  if (!business?.created_by) return undefined;
  if (roleSlug === "admin" || business.created_by === currentUserId) return business.created_by;
  if (roleSlug !== "user") return undefined;

  const connection = await customerManagementModel.findOne({
    where: { created_by: currentUserId, business_id: business.id },
    attributes: ["id"],
  });

  return connection ? business.created_by : undefined;
};

export const findAdminUserIds = async (): Promise<number[]> => {
  const adminRole = await roleModel.findOne({ where: { slug: "admin" }, attributes: ["id"] });
  if (!adminRole) return [];

  const admins = await userModel.findAll({
    where: { role_id: adminRole.id },
    attributes: ["id"],
  });
  return admins.map((admin) => admin.id);
};

export const findManageableUnitByUuid = async (
  uuid: string,
  currentUserId: number,
  isAdmin: boolean,
): Promise<IUnitPublic | undefined> => {
  const unit = await unitModel.findOne({
    where: manageableWhere(uuid, currentUserId, isAdmin),
    attributes: unitAttributes,
  });

  return unit ? toPublicUnit(unit.dataValues, true) : undefined;
};

export const updateUnitByUuid = async (
  uuid: string,
  currentUserId: number,
  isAdmin: boolean,
  data: IUnitUpdateData,
): Promise<IUnitPublic | undefined> => {
  const unit = await unitModel.findOne({
    where: manageableWhere(uuid, currentUserId, isAdmin),
  });

  if (!unit) return undefined;

  const updatedUnit = await unit.update(data);
  return toPublicUnit(updatedUnit.dataValues, true);
};

export const deleteUnitByUuid = async (
  uuid: string,
  currentUserId: number,
  isAdmin: boolean,
): Promise<IUnitPublic | undefined> => {
  const unit = await unitModel.findOne({
    where: manageableWhere(uuid, currentUserId, isAdmin),
  });

  if (!unit) return undefined;

  await unit.update({ deleted_by: currentUserId });
  const deletedUnit = toPublicUnit(unit.dataValues, true);
  await unit.destroy();
  return deletedUnit;
};
