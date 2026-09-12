import type { CorsOptions } from "cors";
import { config } from "./envConfig";


export const corsOptions: CorsOptions = { 
  origin:config.CLIENT_URL,
  methods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};
