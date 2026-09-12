import {
  changePassword,
  forgotPassword,
  listUsers,
  loginUserDetails,
  logoutUser,
  resendVerificationEmail,
  resetPassword,
  signin,
  signup,
  verifyEmail,
} from "@/controllers/userCantroller";
import { authorization } from "@/middlewares/authorizationMiddleware";
import { requireAdmin } from "@/middlewares/roleAuthorizationMiddleware";
import {
  validateChangePassword,
  validateForgotPassword,
  validateResendVerification,
  validateResetPassword,
  validateSignin,
  validateSignup,
} from "@/validations/userValidation";
import { Router } from "express";

export const userRouter = (): Router => {
  const routes: Router = Router();

  /*
  ================================================================================
  ****************************** public routes ***********************************
  ================================================================================
   */
  routes.route("/sign-up").post(validateSignup, signup);
  routes.route("/sign-in").post(validateSignin, signin);
  routes.route("/verify-email").get(verifyEmail);
  routes.route("/resend-verification").post(validateResendVerification, resendVerificationEmail);
  routes.route("/forgot-password").post(validateForgotPassword, forgotPassword);
  routes.route("/reset-password").post(validateResetPassword, resetPassword);

  /*
 ================================================================================
 ****************************** private routes **********************************
 ================================================================================
  */
  routes.route("/current-user").get(authorization, loginUserDetails);
  routes.route("/change-password").patch(authorization, validateChangePassword, changePassword);
  routes.route("/logout").post(authorization, logoutUser);
  routes.route("/list").get(authorization, requireAdmin, listUsers);

  return routes;
};
