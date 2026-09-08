import {
  createOrganization,
  listOrganizations,
  setDefaultOrganization,
  updateOrganization,
} from "@/controllers/organizationController";
import {
  validateCreateOrganization,
  validateOrganizationUuid,
  validateUpdateOrganization,
} from "@/validations/organizationValidation";
import { Router } from "express";

export const organizationRoutes = (): Router => {
  const routes: Router = Router();

  routes.route("/list").get(listOrganizations);
  routes.route("/create").post(validateCreateOrganization, createOrganization);
  routes.route("/update/:uuid").patch(validateUpdateOrganization, updateOrganization);
  routes
    .route("/set-default/:uuid")
    .patch(validateOrganizationUuid, setDefaultOrganization);

  return routes;
};
