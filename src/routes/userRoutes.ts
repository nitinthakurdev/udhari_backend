import { loginUserDetails, logoutUser, signin, signup } from "@/controllers/userCantroller";
import { authorization } from "@/middlewares/authorizationMiddleware";
import { validateSignin, validateSignup } from "@/validations/userValidation";
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

  /*
 ================================================================================
 ****************************** private routes **********************************
 ================================================================================
  */
  routes.route("/current-user").get(authorization, loginUserDetails);
  routes.route("/logout").post(authorization, logoutUser);

  return routes;
};
