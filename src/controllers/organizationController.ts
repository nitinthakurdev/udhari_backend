import { createOrganization, findOrganizationWithNameAndSlug } from "@/services/organizationService";
import type { IOrganizationCreatePayload } from "@/types/organizationTypes";
import { AsyncHandler, BadRequestError, HalSuccess } from "hal-response";
import { StatusCodes } from "http-status-codes";

//----------------- messages imports ------------
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json"
import { toSlug } from "@/utils/slugMaker";




const response = new HalSuccess();



/*
=============================================================================
************************ create organization ********************************
=============================================================================
 */
export const registerOrganization = AsyncHandler(async (req, res): Promise<void> => {
    const data = req.body as IOrganizationCreatePayload;

    const slug = toSlug(data.name);

    const organizationExist = await findOrganizationWithNameAndSlug(data.name, slug);

    if (organizationExist) {
        throw new BadRequestError(errorMessages.ORGANIZATION.EXIST)
    };

   

    const result = await createOrganization({ ...data,slug, created_by: req.currentUser?.id! })

    res.status(StatusCodes.CREATED).json(response.created(result, { message: successMessages.ORGANIZATION.CREATE }))

});