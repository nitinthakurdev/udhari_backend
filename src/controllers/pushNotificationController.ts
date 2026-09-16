import {
  registerPushToken as registerPushTokenService,
  unregisterPushToken as unregisterPushTokenService,
} from "@/services/pushNotificationService";
import type { IRegisterPushTokenPayload } from "@/types/pushNotificationTypes";
import { AsyncHandler, HalSuccess, UnauthorizedError } from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";

const response = new HalSuccess();

export const registerPushToken = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const token = await registerPushTokenService(
    req.currentUser.id,
    req.body as IRegisterPushTokenPayload,
  );

  res
    .status(StatusCodes.OK)
    .json(
      response.ok(
        { uuid: token.uuid },
        { message: "Push notification device registered successfully." },
      ),
    );
});

export const unregisterPushToken = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  await unregisterPushTokenService(
    req.currentUser.id,
    (req.body as { expo_push_token: string }).expo_push_token,
  );

  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: "Push notification device removed successfully." }));
});
