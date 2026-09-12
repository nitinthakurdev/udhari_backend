import {
  connectCustomer,
  createCustomerManagement,
  disconnectCustomer,
  deleteCustomerManagement,
  listCustomerManagement,
  listUsersConnectedToBusiness,
  searchCustomers,
  updateCustomerManagement,
} from "@/controllers/customerManagementController";
import {
  validateConnectCustomer,
  validateCreateCustomerManagement,
  validateCustomerManagementUuid,
  validateUpdateCustomerManagement,
} from "@/validations/customerManagementValidation";
import { validateBusinessUuid } from "@/validations/businessValidation";
import { requireBusinessOrAdmin } from "@/middlewares/roleAuthorizationMiddleware";
import { Router } from "express";

export const customerManagementRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(listCustomerManagement);
  routes.route("/connected-users/:uuid").get(validateBusinessUuid, listUsersConnectedToBusiness);
  routes
    .route("/search-users/:uuid")
    .get(requireBusinessOrAdmin, validateBusinessUuid, searchCustomers);
  routes
    .route("/connect-customer")
    .post(requireBusinessOrAdmin, validateConnectCustomer, connectCustomer);
  routes
    .route("/disconnect-customer/:uuid")
    .delete(requireBusinessOrAdmin, validateCustomerManagementUuid, disconnectCustomer);
  routes.route("/create").post(validateCreateCustomerManagement, createCustomerManagement);
  routes.route("/update/:uuid").patch(validateUpdateCustomerManagement, updateCustomerManagement);
  routes.route("/delete/:uuid").delete(validateCustomerManagementUuid, deleteCustomerManagement);

  return routes;
};
