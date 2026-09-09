/* eslint-disable @typescript-eslint/require-await */
import {
  createUser as createUserService,
  findUserByEmail,
  findUserByEmailOrUsername,
  findUserByIdentifier,
  findUserByVerificationToken,
  findUsers,
  resetPasswordByToken,
  toPublicUser,
  updateEmailVerificationToken,
  updatePasswordResetToken,
  verifyUserEmailByToken,
} from "@/services/userServices";
import { sendEmail } from "@/services/emailService";
import { findRoleBySlag } from "@/services/roleServices";
import type {
  IForgotPasswordPayload,
  IResendVerificationPayload,
  IResetPasswordPayload,
  IUserCreatePayload,
  IUserSigninPayload,
  IUserUniqueField,
} from "@/types/userTypes";
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
import type { CookieOptions, Response } from "express";
import successMessages from "../../successMessages.json";
import errorMessages from "../../errorMessages.json";
import { createHash, randomBytes } from "node:crypto";
import { sequelize } from "@/config/dbConfig";
import { usernameModifier } from "@/utils/slugMaker";

const response = new HalSuccess();
const isDeployedEnvironment = ["staging", "production"].includes(config.NODE_ENV ?? "");
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isDeployedEnvironment,
  sameSite: "lax",
  path: "/",
  ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
};

const createFrontendUrl = (pathname: string, token: string): string => {
  if (!config.CLIENT_URL) {
    throw new InternalServerError(errorMessages.USER.AUTH_CONFIGURATION_ERROR);
  }

  try {
    const baseUrl = config.CLIENT_URL.endsWith("/") ? config.CLIENT_URL : `${config.CLIENT_URL}/`;
    const url = new URL(pathname.replace(/^\//, ""), baseUrl);
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    throw new InternalServerError(errorMessages.USER.AUTH_CONFIGURATION_ERROR);
  }
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const assertUserFieldsAreUnique = (conflicts: IUserUniqueField[]): void => {
  if (conflicts.length === 0) return;

  const lastField = conflicts.at(-1) ?? "";
  const precedingFields = conflicts.slice(0, -1);
  const fieldList =
    conflicts.length === 1
      ? lastField
      : `${precedingFields.join(", ")}${conflicts.length > 2 ? "," : ""} and ${lastField}`;
  const message = `${fieldList.charAt(0).toUpperCase()}${fieldList.slice(1)} already ${conflicts.length === 1 ? "exists" : "exist"}.`;
  const details = conflicts.map((field) => ({
    field,
    message: `${field.charAt(0).toUpperCase()}${field.slice(1)} already exists.`,
  }));

  throw new BadRequestError(message, details);
};

const createAuthenticatedSession = (
  res: Response,
  user: NonNullable<Awaited<ReturnType<typeof findUserByIdentifier>>>,
) => {
  const jwtSecret = config.JWT_TOKEN;
  if (!jwtSecret) {
    throw new InternalServerError(errorMessages.USER.AUTH_CONFIGURATION_ERROR);
  }

  const tokenPayload = { email: user.email, username: user.username };
  const accessToken = jwt.sign(tokenPayload, jwtSecret, {
    subject: user.uuid,
    expiresIn: "7d",
  });
  const refreshToken = jwt.sign(tokenPayload, jwtSecret, {
    subject: user.uuid,
    expiresIn: "30d",
  });

  res.cookie("AT", accessToken, {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("RT", refreshToken, {
    ...sessionCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return {
    user: toPublicUser(user),
    access_token: accessToken,
    refresh_token: refreshToken,
  };
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

  data.username = usernameModifier(data.username);

  const conflicts = await findUserByEmailOrUsername(data.email, data.username, data.phone);
  assertUserFieldsAreUnique(conflicts);

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const defaultRole = await findRoleBySlag("user");

  if (!defaultRole) {
    throw new InternalServerError(errorMessages.USER.DEFAULT_ROLE_NOT_FOUND);
  }

  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const verificationUrl = createFrontendUrl("/verify-email", verificationToken);

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

  const pendingUser = await findUserByVerificationToken(token);
  if (!pendingUser) {
    throw new BadRequestError(errorMessages.USER.VERIFICATION_TOKEN_INVALID);
  }

  const isVerified = await verifyUserEmailByToken(token);
  if (!isVerified) {
    throw new BadRequestError(errorMessages.USER.VERIFICATION_TOKEN_INVALID);
  }

  const verifiedUser = await findUserByIdentifier(pendingUser.email);
  if (!verifiedUser) {
    throw new InternalServerError(errorMessages.AUTHORIZATION.USER_NOT_FOUND);
  }

  const session = createAuthenticatedSession(res, verifiedUser);

  res.status(StatusCodes.OK).json(
    response.ok(session, {
      message: successMessages.USER.EMAIL_VERIFIED,
    }),
  );
});

export const resendVerificationEmail = AsyncHandler(async (req, res): Promise<void> => {
  const { email, token } = req.body as IResendVerificationPayload;
  let user = token ? await findUserByVerificationToken(token) : undefined;

  if (!user && email) {
    user = await findUserByEmail(email);
  }

  if (user && !user.is_email_verified) {
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationUrl = createFrontendUrl("/verify-email", verificationToken);

    await sequelize.transaction(async (transaction) => {
      await updateEmailVerificationToken(
        user.id,
        verificationToken,
        verificationTokenExpiry,
        transaction,
      );

      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your Udhari account",
          template: "verify-email",
          data: { name: user.first_name, verificationUrl },
          text: `Hi ${user.first_name}, verify your Udhari account by opening this link: ${verificationUrl}. This link expires in 24 hours.`,
        });
      } catch (error: unknown) {
        console.error("Failed to resend verification email", error);
        throw new InternalServerError(errorMessages.USER.EMAIL_SEND_FAILED);
      }
    });
  }

  res.status(StatusCodes.OK).json(
    response.ok(null, {
      message: successMessages.USER.VERIFICATION_EMAIL_SENT,
    }),
  );
});

export const forgotPassword = AsyncHandler(async (req, res): Promise<void> => {
  const { email } = req.body as IForgotPasswordPayload;
  const user = await findUserByEmail(email);

  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const resetUrl = createFrontendUrl("/reset-password", resetToken);

    await sequelize.transaction(async (transaction) => {
      await updatePasswordResetToken(user.id, hashToken(resetToken), resetTokenExpiry, transaction);

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Udhari password",
          template: "reset-password",
          data: { name: user.first_name, resetUrl },
          text: `Hi ${user.first_name}, reset your Udhari password by opening this link: ${resetUrl}. This one-time link expires in 1 hour.`,
        });
      } catch (error: unknown) {
        console.error("Failed to send password reset email", error);
        throw new InternalServerError(errorMessages.USER.EMAIL_SEND_FAILED);
      }
    });
  }

  res.status(StatusCodes.OK).json(
    response.ok(null, {
      message: successMessages.USER.PASSWORD_RESET_EMAIL_SENT,
    }),
  );
});

export const resetPassword = AsyncHandler(async (req, res): Promise<void> => {
  const { token, password } = req.body as IResetPasswordPayload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const isReset = await resetPasswordByToken(hashToken(token), hashedPassword);

  if (!isReset) {
    throw new BadRequestError(errorMessages.USER.RESET_TOKEN_INVALID);
  }

  res
    .clearCookie("AT", sessionCookieOptions)
    .clearCookie("RT", sessionCookieOptions)
    .status(StatusCodes.OK)
    .json(
      response.ok(null, {
        message: successMessages.USER.PASSWORD_RESET,
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

  const session = createAuthenticatedSession(res, user);

  const requestId = req.header("x-request-id");

  res.status(StatusCodes.OK).json(
    response.ok(session, {
      message: successMessages.USER.USER_SIGNED_IN,
      ...(requestId ? { requestId } : {}),
    }),
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
