/* eslint-disable @typescript-eslint/require-await */
import {
  createUser as createUserService,
  findUserByEmailOrUsername,
  findUserByIdentifier,
  findUsers,
  toPublicUser,
  verifyUserEmailByToken,
} from "@/services/userServices";
import { sendEmail } from "@/services/emailService";
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
import type { CookieOptions } from "express";
import successMessages from "../../successMessages.json";
import errorMessages from "../../errorMessages.json";
import { randomBytes } from "node:crypto";
import { sequelize } from "@/config/dbConfig";

const response = new HalSuccess();
const isDeployedEnvironment = ["staging", "production"].includes(config.NODE_ENV ?? "");
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isDeployedEnvironment,
  sameSite: "lax",
  path: "/",
  ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
};

export const listUsers = AsyncHandler(async (_req, res): Promise<void> => {
  const users = await findUsers();

  res.status(StatusCodes.OK).json(
    response.ok(users, {
      message: successMessages.USER.USER_LIST,
    }),
  );
});

/*
 ===============================================================================================
 ************************** sign up api code start here ***************************************
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

  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const requestHost = req.get("host");
  if (!requestHost) {
    throw new InternalServerError(errorMessages.USER.AUTH_CONFIGURATION_ERROR);
  }
  const verificationUrl = `${req.protocol}://${requestHost}/api/v1/users/verify-email?token=${encodeURIComponent(verificationToken)}`;

  const user = await sequelize.transaction(async (transaction) => {
    const createdUser = await createUserService(
      {
        ...data,
        password: hashedPassword,
        role_id: defaultRole.id,
        verification_token: verificationToken,
        verification_token_expiry: verificationTokenExpiry,
      },
      transaction,
    );

    try {
      await sendEmail({
        to: createdUser.email,
        subject: "Verify your Udhari account",
        template: "verify-email",
        data: {
          name: createdUser.first_name,
          verificationUrl,
        },
        text: `Hi ${createdUser.first_name}, verify your Udhari account by opening this link: ${verificationUrl}. This link expires in 24 hours.`,
      });
    } catch (error: unknown) {
      console.error("Failed to send verification email", error);
      throw new InternalServerError(errorMessages.USER.EMAIL_SEND_FAILED);
    }

    return createdUser;
  });

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.CREATED).json(
    response.created(user, {
      message: successMessages.USER.USER_CREATED,
      ...(requestId ? { requestId } : {}),
    }),
  );
});

export const verifyEmail = AsyncHandler(async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";

  if (!token) {
    throw new BadRequestError(errorMessages.USER.VERIFICATION_TOKEN_REQUIRED);
  }

  const isVerified = await verifyUserEmailByToken(token);
  if (!isVerified) {
    throw new BadRequestError(errorMessages.USER.VERIFICATION_TOKEN_INVALID);
  }

  res.status(StatusCodes.OK).json(
    response.ok(null, {
      message: successMessages.USER.EMAIL_VERIFIED,
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

  const authenticatedUser = toPublicUser(user);

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

  res.cookie("AT", accessToken, {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("RT", refreshToken, {
    ...sessionCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.OK).json(
    response.ok(
      {
        user: authenticatedUser,
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
export const loginUserDetails = AsyncHandler(async (req, res): Promise<void> => {
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
export const logoutUser = AsyncHandler(async (req, res): Promise<void> => {
  const user = req.currentUser;
  if (!user) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.USER_UNAUTHORIZED);
  }

  res
    .clearCookie("AT", sessionCookieOptions)
    .clearCookie("RT", sessionCookieOptions)
    .status(StatusCodes.ACCEPTED)
    .json(
      response.accepted(null, {
        message: successMessages.USER.LOGOUT_USER,
      }),
    );
});
