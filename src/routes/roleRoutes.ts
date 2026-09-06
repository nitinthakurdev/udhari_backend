import { createRole } from "@/controllers/roleController";
import { validateCreateRole } from "@/validations/roleValidation";
import { Router } from "express";

export const roleRouter = (): Router => {
  const routes = Router();

  routes.route("/").post(validateCreateRole, createRole);

  return routes;
};
