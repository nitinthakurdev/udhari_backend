import { Router } from "express";
import { roleRouter } from "@/routes/roleRoutes";
import { userRouter } from "@/routes/userRoutes";
import { authorization } from "./middlewares/authorizationMiddleware";
import { organizationRoutes } from "./routes/organizationRoutes";

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users", userRouter());
  routes.use("/roles",authorization, roleRouter());
  routes.use("/organization",authorization,organizationRoutes())
  return routes;
};
