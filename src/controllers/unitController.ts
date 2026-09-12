import {
  createUnit as createUnitService,
  deleteUnitByUuid,
  findAccessibleBusinessOwnerId,
  findAdminUserIds,
  findManageableUnitByUuid,
  findUnitByName,
  findUnitByUuid,
  findUnits,
  updateUnitByUuid,
} from "@/services/unitService";
import type { IUnitCreatePayload, IUnitUpdatePayload } from "@/types/unitTypes";
import {
  AsyncHandler,
  ConflictError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const listUnits = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const isAdmin = req.currentUser.user_role?.slug === "admin";
  const units = await findUnits(
    req.currentUser.id,
    isAdmin,
    req.currentUser.user_role?.slug === "business" ? req.currentUser.id : undefined,
  );
  res.status(StatusCodes.OK).json(response.ok(units, { message: successMessages.UNIT.LIST }));
});

export const listBusinessUnits = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const roleSlug = req.currentUser.user_role?.slug ?? "";
  const businessOwnerId = await findAccessibleBusinessOwnerId(
    req.params["uuid"] as string,
    req.currentUser.id,
    roleSlug,
  );

  if (!businessOwnerId) throw new NotFoundError(errorMessages.UNIT.BUSINESS_NOT_FOUND);

  const units = await findUnits(req.currentUser.id, roleSlug === "admin", businessOwnerId);
  res.status(StatusCodes.OK).json(response.ok(units, { message: successMessages.UNIT.LIST }));
});

export const getUnit = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const roleSlug = req.currentUser.user_role?.slug;
  const unit = await findUnitByUuid(
    req.params["uuid"] as string,
    req.currentUser.id,
    req.currentUser.user_role?.slug === "admin",
    roleSlug === "business" ? req.currentUser.id : undefined,
  );

  if (!unit) throw new NotFoundError(errorMessages.UNIT.NOT_FOUND);

  res.status(StatusCodes.OK).json(response.ok(unit, { message: successMessages.UNIT.GET }));
});

export const createUnit = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as IUnitCreatePayload;
  const isAdmin = req.currentUser.user_role?.slug === "admin";
  const creatorIds = isAdmin ? await findAdminUserIds() : [req.currentUser.id];
  const existingUnit = await findUnitByName(data.name, creatorIds);

  if (existingUnit) throw new ConflictError(errorMessages.UNIT.ALREADY_EXISTS);

  const unit = await createUnitService({
    name: data.name,
    created_by: req.currentUser.id,
  });
  res
    .status(StatusCodes.CREATED)
    .json(response.created(unit, { message: successMessages.UNIT.CREATE }));
});

export const updateUnit = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const data = req.body as IUnitUpdatePayload;
  const isAdmin = req.currentUser.user_role?.slug === "admin";
  const currentUnit = await findManageableUnitByUuid(uuid, req.currentUser.id, isAdmin);

  if (!currentUnit) throw new NotFoundError(errorMessages.UNIT.NOT_FOUND);

  if (data.name) {
    const existingUnit = await findUnitByName(
      data.name,
      currentUnit.created_by ? [currentUnit.created_by] : [],
      uuid,
    );
    if (existingUnit) throw new ConflictError(errorMessages.UNIT.ALREADY_EXISTS);
  }

  const unit = await updateUnitByUuid(uuid, req.currentUser.id, isAdmin, {
    ...data,
    updated_by: req.currentUser.id,
  });

  if (!unit) throw new NotFoundError(errorMessages.UNIT.NOT_FOUND);

  res.status(StatusCodes.OK).json(response.ok(unit, { message: successMessages.UNIT.UPDATE }));
});

export const deleteUnit = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const isAdmin = req.currentUser.user_role?.slug === "admin";
  const unit = await deleteUnitByUuid(req.params["uuid"] as string, req.currentUser.id, isAdmin);

  if (!unit) throw new NotFoundError(errorMessages.UNIT.NOT_FOUND);

  res.status(StatusCodes.OK).json(response.ok(unit, { message: successMessages.UNIT.DELETE }));
});
