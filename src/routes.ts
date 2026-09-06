import { Router } from "express";
import { roleRouter } from "@/routes/roleRoutes";
import { userRouter } from "@/routes/userRoutes";

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users", userRouter());
  routes.use("/roles", roleRouter());
  return routes;
};
