import {
  createUser as createUserService,
  findUserByEmailOrUsername,
} from "@/services/userServices";
import type { IUserCreatePayload } from "@/types/userTypes";
import { AsyncHandler, BadRequestError, HalSuccess } from "hal-response";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import successMessages from "../../successMessages.json";
import errorMessages from "../../errorMessages.json";

const response = new HalSuccess();

export const signup = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IUserCreatePayload;

  const existUser = await findUserByEmailOrUsername(data.email, data.username);
  if (existUser) {
    throw new BadRequestError(errorMessages.USER.ALREADY_EXIST);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await createUserService({ ...data, password: hashedPassword });

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.CREATED).json(
    response.created(user, {
      message: successMessages.USER.USER_CREATED,
      ...(requestId ? { requestId } : {}),
    }),
  );
});
