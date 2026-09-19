import { Router } from "express";
import { roleRouter } from "@/routes/roleRoutes";
import { userRouter } from "@/routes/userRoutes";
import { authorization } from "./middlewares/authorizationMiddleware";
import { businessRoutes } from "./routes/businessRoutes";
import { requireAdmin } from "./middlewares/roleAuthorizationMiddleware";
import { subscriptionRoutes } from "./routes/subscriptionRoutes";
import { listPublicSubscriptions } from "./controllers/subscriptionController";
import { customerManagementRoutes } from "./routes/customerManagementRoutes";
import { transitionRoutes } from "./routes/transitionRoutes";
import { unitRoutes } from "./routes/unitRoutes";
import { userSubscriptionRoutes } from "./routes/userSubscriptionRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";
import { billingRoutes } from "./routes/billingRoutes";
import { requireActiveSubscription } from "./middlewares/subscriptionAuthorizationMiddleware";
import { recurringTransactionConfigRoutes } from "./routes/recurringTransactionConfigRoutes";

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users", userRouter());
  routes.use("/roles", authorization, requireAdmin, roleRouter());
  routes.use("/business", authorization, requireActiveSubscription, businessRoutes());
  routes.use(
    "/customer-management",
    authorization,
    requireActiveSubscription,
    customerManagementRoutes(),
  );
  routes.use("/transitions", authorization, requireActiveSubscription, transitionRoutes());
  routes.use("/units", authorization, requireActiveSubscription, unitRoutes());
  routes.get("/subscriptions/public", listPublicSubscriptions);
  routes.use("/subscriptions", authorization, requireAdmin, subscriptionRoutes());
  routes.use("/user-subscriptions", authorization, userSubscriptionRoutes());
  routes.use("/payments", authorization, paymentRoutes());
  routes.use("/billings", authorization, requireActiveSubscription, billingRoutes());
  routes.use(
    "/recurring-configs",
    authorization,
    requireActiveSubscription,
    recurringTransactionConfigRoutes(),
  );
  return routes;
};
