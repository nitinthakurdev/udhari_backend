import { listOrganizations, registerOrganization } from "@/controllers/organizationController";
import { validateCreateOrganization } from "@/validations/organizationValidation";
import { Router } from "express";

export const organizationRoutes = (): Router => {
  const routes: Router = Router();

  routes.route("/").get(listOrganizations);
  routes.route("/create").post(validateCreateOrganization, registerOrganization);

  return routes;
};
