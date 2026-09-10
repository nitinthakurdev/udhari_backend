import { Router } from "express";
import { roleRouter } from "@/routes/roleRoutes";
import { userRouter } from "@/routes/userRoutes";
import { authorization } from "./middlewares/authorizationMiddleware";
import { businessRoutes } from "./routes/businessRoutes";
import { requireAdmin } from "./middlewares/roleAuthorizationMiddleware";
import { subscriptionRoutes } from "./routes/subscriptionRoutes";
import { listPublicSubscriptions } from "./controllers/subscriptionController";

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users", userRouter());
  routes.use("/roles", authorization, requireAdmin, roleRouter());
  routes.use("/business", authorization, businessRoutes());
  routes.get("/subscriptions/public", listPublicSubscriptions);
  routes.use("/subscriptions", authorization, requireAdmin, subscriptionRoutes());
  return routes;
};
