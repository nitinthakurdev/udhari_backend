import { createRole, listRoles } from "@/controllers/roleController";
import { validateCreateRole } from "@/validations/roleValidation";
import { Router } from "express";

export const roleRouter = (): Router => {
  const routes = Router();

  routes.route("/").post(validateCreateRole, createRole);
  routes.route("/list").get(listRoles);

  return routes;
};
