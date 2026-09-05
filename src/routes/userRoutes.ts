import { signup } from "@/controllers/userCantroller";
import { validateSignup } from "@/validations/userValidation";
import { Router } from "express";

export const userRouter = (): Router => {
  const routes: Router = Router();

  routes.route("/sign-up").post(validateSignup, signup);

  return routes;
};
