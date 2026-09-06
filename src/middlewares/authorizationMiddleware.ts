import { config } from "@/config/envConfig";
import { findUserByUsername } from "@/services/userServices";
import type { NextFunction, Request, Response } from "express";
import { AsyncHandler, BadRequestError, UnauthorizedError } from "hal-response";
import jwt, { JsonWebTokenError, TokenExpiredError, type JwtPayload } from "jsonwebtoken";
import errorMessages from "../../errorMessages.json";

interface AccessTokenPayload extends JwtPayload {
  username: string;
}

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload =>
  typeof payload !== "string" && typeof payload["username"] === "string";

export const authorization = AsyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const accessToken = (req.cookies["AT"] ?? req.headers.authorization?.split(" ")[1]) as
      string | undefined;

    if (!accessToken) {
      throw new UnauthorizedError(errorMessages.AUTHORIZATION.TOKEN_NOT_FOUND);
    }

    if (!config.JWT_TOKEN) {
      throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHORIZATION_FAILED);
    }

    let payload: string | JwtPayload;

    try {
      payload = jwt.verify(accessToken, config.JWT_TOKEN);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError(errorMessages.AUTHORIZATION.TOKEN_EXPIRED);
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedError(errorMessages.AUTHORIZATION.TOKEN_MALFORMED);
      }

      throw error;
    }

    if (!isAccessTokenPayload(payload)) {
      throw new UnauthorizedError(errorMessages.AUTHORIZATION.TOKEN_INVALID);
    }

    const user = await findUserByUsername(payload.username);

    if (!user) {
      throw new BadRequestError(errorMessages.AUTHORIZATION.USER_NOT_FOUND);
    }

    req.currentUser = user;
    next();
  },
);
