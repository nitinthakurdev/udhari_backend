import {
  json,
  type NextFunction,
  urlencoded,
  type Application,
  type Request,
  type Response,
} from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { corsOptions } from "./config/corsConfig";
import { HalError, type SerializedErrorResponse } from "hal-response";
import { appRouter } from "@/routes";
import { dbConnection } from "./config/dbConfig";
import { StatusCodes } from "http-status-codes";
import compressor from "compression";
import cookieParser from "cookie-parser";


// ---------- all associations import below here ---------
import "./association/userAssociation"

const SERVER_PORT = 4001;

export const Start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesHandler(app);
  errorHandler(app);
  connectionsHandler();
  startServer(app);
};

function securityMiddleware(app: Application): void {
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(hpp());
  app.use(cors(corsOptions));
  app.use(compressor());
  app.use(cookieParser());
}

function standardMiddleware(app: Application): void {
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ limit: "100mb", extended: true }));
}

function routesHandler(app: Application): void {
  app.use("/health", (_req: Request, res: Response) =>
    res.send("Server is up and running \n Server is healthy and ok"),
  );
  app.use("/api/v1", appRouter());
}

function connectionsHandler() {
  void dbConnection();
}

function errorHandler(app: Application): void {
  app.use("/", (req: Request, res: Response) => {
    const fullUrl = `https://${req.host}${req.originalUrl}`;
    res.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found",
      route: fullUrl,
      success: false,
    });
  });

  app.use(
    (err: SerializedErrorResponse, _req: Request, res: Response, next: NextFunction): void => {
      if (err instanceof HalError) {
        res.status(err.statusCode).json(err.serialize());
        return;
      }
      next(err);
    },
  );
}

function startServer(app: Application) {
  const server: http.Server = http.createServer(app);
  server.listen(SERVER_PORT, () => {
    console.log("server is up and running on port %d", SERVER_PORT);
  });
}
