import type { Application,Request,Response } from "express";
import http from "http";

const SERVER_PORT = 4001;

export const Start = (app: Application) => {
  routesHandler(app)
  startServer(app);
};

function routesHandler(app:Application) {
  app.use("/health",(_req:Request,res:Response) => res.send("Server is up and running \n Server is healthy and ok"))
}

function startServer(app: Application) {
  const server: http.Server = http.createServer(app);
  server.listen(SERVER_PORT, () => {
    console.log("server is up and running on port %d",SERVER_PORT);
  });
}
