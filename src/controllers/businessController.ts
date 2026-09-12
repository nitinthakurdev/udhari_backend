import {
  createBusiness as createBusinessService,
  deleteBusinessByUuid,
  findBusinessesByCreator,
  findBusinessWithNameAndSlug,
  searchBusinessesByNameOrSlug,
  setDefaultBusinessByUuid,
  updateBusinessByUuid,
} from "@/services/businessService";
import type {
  IBusinessCreatePayload,
  IBusinessUpdateData,
  IBusinessUpdatePayload,
} from "@/types/businessTypes";
import {
  AsyncHandler,
  BadRequestError,
  ConflictError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";

//----------------- messages imports ------------
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";
import validationMessages from "../../validationMessage.json";
import { toSlug } from "@/utils/slugMaker";
import { findByIdAndUpdateWhere } from "@/services/userServices";
import { findRoleBySlag } from "@/services/roleServices";

const response = new HalSuccess();

/*
=============================================================================
************************ list businesses *********************************
=============================================================================
 */
export const listBusinesses = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const result = await findBusinessesByCreator(req.currentUser.id);

  res.status(StatusCodes.OK).json(response.ok(result, { message: successMessages.BUSINESS.LIST }));
});

/*
=============================================================================
************************ search businesses ********************************
=============================================================================
 */
export const searchBusinesses = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const searchKey = typeof req.query["key"] === "string" ? req.query["key"].trim() : "";

  if (!searchKey) {
    throw new BadRequestError("Search key is required.");
  }

  const result = await searchBusinessesByNameOrSlug(searchKey, req.currentUser.id);

  res.status(StatusCodes.OK).json(response.ok(result, { message: successMessages.BUSINESS.LIST }));
});

/*
=============================================================================
************************ create business ********************************
=============================================================================
 */
export const createBusiness = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IBusinessCreatePayload;

  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const slug = toSlug(data.name);

  const businessExist = await findBusinessWithNameAndSlug(data.name, slug);

  if (businessExist) {
    throw new BadRequestError(errorMessages.BUSINESS.EXIST);
  }

  const result = await createBusinessService({
    ...data,
    slug,
    created_by: req.currentUser.id,
  });

  const role = await findRoleBySlag("business");

  await findByIdAndUpdateWhere(
    { id: req.currentUser.id, business_id: null },
    { business_id: result.id, ...(role && { role_id: role.id }) },
  );

  res
    .status(StatusCodes.CREATED)
    .json(response.created(result, { message: successMessages.BUSINESS.CREATE }));
});

/*
=============================================================================
************************ update business ********************************
=============================================================================
 */
export const updateBusiness = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const businessUuid = req.params["uuid"];

  if (typeof businessUuid !== "string") {
    throw new BadRequestError(validationMessages.BUSINESS.UUID_INVALID);
  }

  const data = req.body as IBusinessUpdatePayload;
  const updateData: IBusinessUpdateData = {
    ...data,
    updated_by: req.currentUser.id,
  };

  if (data.name) {
    const slug = toSlug(data.name);
    const businessExists = await findBusinessWithNameAndSlug(data.name, slug, businessUuid);

    if (businessExists) {
      throw new ConflictError(errorMessages.BUSINESS.EXIST);
    }

    updateData.slug = slug;
  }

  const result = await updateBusinessByUuid(businessUuid, req.currentUser.id, updateData);

  if (!result) {
    throw new NotFoundError(errorMessages.BUSINESS.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.BUSINESS.UPDATE }));
});

/*
=============================================================================
************************ set default business ***************************
=============================================================================
 */
export const setDefaultBusiness = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const businessUuid = req.params["uuid"];

  if (typeof businessUuid !== "string") {
    throw new BadRequestError(validationMessages.BUSINESS.UUID_INVALID);
  }

  const result = await setDefaultBusinessByUuid(businessUuid, req.currentUser.id);

  if (!result) {
    throw new NotFoundError(errorMessages.BUSINESS.DEFAULT_NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.BUSINESS.SET_DEFAULT }));
});

export const deleteBusiness = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const businessUuid = req.params["uuid"];
  if (typeof businessUuid !== "string") {
    throw new BadRequestError(validationMessages.BUSINESS.UUID_INVALID);
  }

  const deleted = await deleteBusinessByUuid(businessUuid, req.currentUser.id);
  if (!deleted) {
    throw new NotFoundError(errorMessages.BUSINESS.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(response.ok(null, { message: successMessages.BUSINESS.DELETE }));
});
