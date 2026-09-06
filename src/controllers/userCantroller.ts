import {
  createUser as createUserService,
  findUserByEmailOrUsername,
  findUserByIdentifier,
  toPublicUser,
} from "@/services/userServices";
import { findRoleBySlag } from "@/services/roleServices";
import type { IUserCreatePayload, IUserSigninPayload } from "@/types/userTypes";
import { config } from "@/config/envConfig";
import {
  AsyncHandler,
  BadRequestError,
  HalSuccess,
  InternalServerError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
  const defaultRole = await findRoleBySlag("user");

  if (!defaultRole) {
    throw new InternalServerError(errorMessages.USER.DEFAULT_ROLE_NOT_FOUND);
  }

  const user = await createUserService({
    ...data,
    password: hashedPassword,
    role_id: defaultRole.id,
  });

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.CREATED).json(
    response.created(user, {
      message: successMessages.USER.USER_CREATED,
      ...(requestId ? { requestId } : {}),
    }),
  );
});

export const signin = AsyncHandler(async (req, res): Promise<void> => {
  const data = req.body as IUserSigninPayload;
  const user = await findUserByIdentifier(data.identifier);

  if (!user?.password) {
    throw new UnauthorizedError(errorMessages.USER.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError(errorMessages.USER.INVALID_CREDENTIALS);
  }

  if (!user.is_email_verified) {
    throw new BadRequestError(errorMessages.USER.ACCOUNT_NOT_VERIFIED);
  }

  const jwtSecret = config.JWT_TOKEN;
  if (!jwtSecret) {
    throw new InternalServerError(errorMessages.USER.AUTH_CONFIGURATION_ERROR);
  }

  const accessToken = jwt.sign(
    {
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    {
      subject: user.uuid,
      expiresIn: "7d",
    },
  );

  const refreshToken = jwt.sign(
    {
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    {
      subject: user.uuid,
      expiresIn: "30d",
    },
  );

  res.cookie("AT", accessToken);
  res.cookie("RT", refreshToken);

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.OK).json(
    response.ok(
      {
        user: toPublicUser(user),
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      {
        message: successMessages.USER.USER_SIGNED_IN,
        ...(requestId ? { requestId } : {}),
      },
    ),
  );
});
