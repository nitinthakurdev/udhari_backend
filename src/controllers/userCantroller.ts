/* eslint-disable @typescript-eslint/require-await */
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

/*
 ===============================================================================================
 ************************** logged-in user details api code start here ************************
 ===============================================================================================
 */
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

/*
 ===============================================================================================
 ************************** sign in api code start here ***************************************
 ===============================================================================================
 */
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

/*
 ===============================================================================================
 ************************** sign up api code start here ***************************************
 ===============================================================================================
 */
export const loginUserDetails = AsyncHandler(async (req, res):Promise<void> => {
  const user = req.currentUser;

  if (!user) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.OK).json(
    response.ok(user, {
      message: successMessages.USER.CURRENT_USER_FETCHED,
      ...(requestId ? { requestId } : {}),
    }),
  );
});

/*
 ===============================================================================================
 ************************** sign up api code start here ***************************************
 ===============================================================================================
 */
export const logoutUser = AsyncHandler(async (req,res):Promise<void> => {

  const user = req.currentUser;
  if(!user){
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.USER_UNAUTHORIZED);
  };

  res.clearCookie("AT").clearCookie("RT").status(StatusCodes.ACCEPTED).json(response.accepted(null,{
    message:successMessages.USER.LOGOUT_USER,
  }))

})
