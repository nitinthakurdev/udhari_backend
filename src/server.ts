import { json, urlencoded, type Application,type Request,type Response } from "express";
import http from "http";
import cors, { type CorsOptions } from "cors";
import { corsOptions } from "@/config/corsConfig";

const SERVER_PORT = 4001;

export const Start = (app: Application) => {
  slanderedMiddleware(app);
  routesHandler(app);
  errorHandler(app);
  startServer(app);
};

function slanderedMiddleware(app:Application){
  app.use(json({limit:'100mb'}));
  app.use(urlencoded({limit:"100mb",extended:true}));
  app.use(cors(corsOptions as CorsOptions));
}

function routesHandler(app:Application) {
  app.use("/health",(_req:Request,res:Response) => res.send("Server is up and running \n Server is healthy and ok"))
}

function errorHandler(app:Application) {
  app.use('/',(req:Request,res:Response) => {
    const fullUrl = `https://${req.host}${req.originalUrl}`;
    res.status(404).json({
      message:"Route not found",
      route:fullUrl,
      success:false
    })
  })
}

function startServer(app: Application) {
  const server: http.Server = http.createServer(app);
  server.listen(SERVER_PORT, () => {
    console.log("server is up and running on port %d",SERVER_PORT);
  });
}
