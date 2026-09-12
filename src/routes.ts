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

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users", userRouter());
  routes.use("/roles", authorization, requireAdmin, roleRouter());
  routes.use("/business", authorization, businessRoutes());
  routes.use("/customer-management", authorization, customerManagementRoutes());
  routes.use("/transitions", authorization, transitionRoutes());
  routes.use("/units", authorization, unitRoutes());
  routes.get("/subscriptions/public", listPublicSubscriptions);
  routes.use("/subscriptions", authorization, requireAdmin, subscriptionRoutes());
  return routes;
};
