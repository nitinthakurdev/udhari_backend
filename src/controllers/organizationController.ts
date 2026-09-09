import {
  createOrganization as createOrganizationService,
  deleteOrganizationByUuid,
  findOrganizationsByCreator,
  findOrganizationWithNameAndSlug,
  setDefaultOrganizationByUuid,
  updateOrganizationByUuid,
} from "@/services/organizationService";
import type {
  IOrganizationCreatePayload,
  IOrganizationUpdateData,
  IOrganizationUpdatePayload,
} from "@/types/organizationTypes";
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
************************ list organizations *********************************
=============================================================================
 */
export const listOrganizations = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const result = await findOrganizationsByCreator(req.currentUser.id);

  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.ORGANIZATION.LIST }));
});

/*
=============================================================================
************************ create organization ********************************
=============================================================================
 */
export const createOrganization = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IOrganizationCreatePayload;

  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const slug = toSlug(data.name);

  const organizationExist = await findOrganizationWithNameAndSlug(data.name, slug);

  if (organizationExist) {
    throw new BadRequestError(errorMessages.ORGANIZATION.EXIST);
  }

  const result = await createOrganizationService({
    ...data,
    slug,
    created_by: req.currentUser.id,
  });

  const role = await findRoleBySlag("organization");

  await findByIdAndUpdateWhere(
    { id: req.currentUser.id, organization_id: null },
    { organization_id: result.id, ...(role && { role_id: role.id }) },
  );

  res
    .status(StatusCodes.CREATED)
    .json(response.created(result, { message: successMessages.ORGANIZATION.CREATE }));
});

/*
=============================================================================
************************ update organization ********************************
=============================================================================
 */
export const updateOrganization = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const organizationUuid = req.params["uuid"];

  if (typeof organizationUuid !== "string") {
    throw new BadRequestError(validationMessages.ORGANIZATION.UUID_INVALID);
  }

  const data = req.body as IOrganizationUpdatePayload;
  const updateData: IOrganizationUpdateData = {
    ...data,
    updated_by: req.currentUser.id,
  };

  if (data.name) {
    const slug = toSlug(data.name);
    const organizationExists = await findOrganizationWithNameAndSlug(
      data.name,
      slug,
      organizationUuid,
    );

    if (organizationExists) {
      throw new ConflictError(errorMessages.ORGANIZATION.EXIST);
    }

    updateData.slug = slug;
  }

  const result = await updateOrganizationByUuid(organizationUuid, req.currentUser.id, updateData);

  if (!result) {
    throw new NotFoundError(errorMessages.ORGANIZATION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.ORGANIZATION.UPDATE }));
});

/*
=============================================================================
************************ set default organization ***************************
=============================================================================
 */
export const setDefaultOrganization = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const organizationUuid = req.params["uuid"];

  if (typeof organizationUuid !== "string") {
    throw new BadRequestError(validationMessages.ORGANIZATION.UUID_INVALID);
  }

  const result = await setDefaultOrganizationByUuid(organizationUuid, req.currentUser.id);

  if (!result) {
    throw new NotFoundError(errorMessages.ORGANIZATION.DEFAULT_NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.ORGANIZATION.SET_DEFAULT }));
});

export const deleteOrganization = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const organizationUuid = req.params["uuid"];
  if (typeof organizationUuid !== "string") {
    throw new BadRequestError(validationMessages.ORGANIZATION.UUID_INVALID);
  }

  const deleted = await deleteOrganizationByUuid(organizationUuid, req.currentUser.id);
  if (!deleted) {
    throw new NotFoundError(errorMessages.ORGANIZATION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: successMessages.ORGANIZATION.DELETE }));
});
