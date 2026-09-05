import type { CorsOptions } from "cors";
import { config } from "@/config/envConfig";

type StaticOrigin = boolean | string | RegExp | (boolean | string | RegExp)[];
type OriginCallback = (error: Error | null, allowedOrigin?: StaticOrigin) => void;

export const corsOptions: CorsOptions = {
  origin(origin: string | undefined, callback: OriginCallback): void {
    if (!origin || config.CLIENT_URL.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};
