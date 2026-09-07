import {
  createOrganization,
  findOrganizationsByCreator,
  findOrganizationWithNameAndSlug,
} from "@/services/organizationService";
import type { IOrganizationCreatePayload } from "@/types/organizationTypes";
import { AsyncHandler, BadRequestError, HalSuccess, UnauthorizedError } from "hal-response";
import { StatusCodes } from "http-status-codes";

//----------------- messages imports ------------
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";
import { toSlug } from "@/utils/slugMaker";

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
export const registerOrganization = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IOrganizationCreatePayload;

  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const slug = toSlug(data.name);

  const organizationExist = await findOrganizationWithNameAndSlug(data.name, slug);

  if (organizationExist) {
    throw new BadRequestError(errorMessages.ORGANIZATION.EXIST);
  }

  const result = await createOrganization({ ...data, slug, created_by: req.currentUser.id });

  res
    .status(StatusCodes.CREATED)
    .json(response.created(result, { message: successMessages.ORGANIZATION.CREATE }));
});
