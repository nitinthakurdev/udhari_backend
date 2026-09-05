import { Router } from "express";
import { userRouter } from "@/routes/userRoutes";

export const appRouter = (): Router => {
  const routes: Router = Router();
  routes.use("/users",userRouter())
  return routes;
};
