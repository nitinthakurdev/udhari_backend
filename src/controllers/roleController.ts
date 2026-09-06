import { createRole as createRoleService, findRoleByNameOrSlag } from "@/services/roleServices";
import type { IRoleCreatePayload } from "@/types/roleTypes";
import { AsyncHandler, BadRequestError, HalSuccess } from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const createRole = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IRoleCreatePayload;
  const existingRole = await findRoleByNameOrSlag(data.name, data.slug);

  if (existingRole) {
    throw new BadRequestError(errorMessages.ROLE.ALREADY_EXIST);
  }

  const role = await createRoleService(data);
  const requestId = req.header("x-request-id");

  res.status(StatusCodes.CREATED).json(
    response.created(role, {
      message: successMessages.ROLE.ROLE_CREATED,
      ...(requestId ? { requestId } : {}),
    }),
  );
});
