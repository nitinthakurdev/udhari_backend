import { signin, signup } from "@/controllers/userCantroller";
import { validateSignin, validateSignup } from "@/validations/userValidation";
import { Router } from "express";

export const userRouter = (): Router => {
  const routes: Router = Router();

  routes.route("/sign-up").post(validateSignup, signup);
  routes.route("/sign-in").post(validateSignin, signin);

  return routes;
};
