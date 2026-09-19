import {
  connectCustomer,
  createCustomerManagement,
  disconnectCustomer,
  connectDirectUser,
  deleteCustomerManagement,
  listCustomerManagement,
  listBusinessConnectionsForBusiness,
  listConnectionRequests,
  listDirectUserConnections,
  listUsersConnectedToBusiness,
  searchCustomers,
  searchDirectUsers,
  respondToRequest,
  updateCustomerManagement,
} from "@/controllers/customerManagementController";
import {
  validateConnectCustomer,
  validateConnectUser,
  validateConnectionRequestResponse,
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
  routes.route("/connected-users-direct").get(listDirectUserConnections);
  routes.route("/search-direct-users").get(searchDirectUsers);
  routes.route("/connect-user").post(validateConnectUser, connectDirectUser);
  routes
    .route("/disconnect-user/:uuid")
    .delete(validateCustomerManagementUuid, deleteCustomerManagement);
  routes.route("/requests").get(listConnectionRequests);
  routes.route("/requests/:uuid").patch(validateConnectionRequestResponse, respondToRequest);
  routes.route("/connected-users/:uuid").get(validateBusinessUuid, listUsersConnectedToBusiness);
  routes
    .route("/connected-businesses/:uuid")
    .get(requireBusinessOrAdmin, validateBusinessUuid, listBusinessConnectionsForBusiness);
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
