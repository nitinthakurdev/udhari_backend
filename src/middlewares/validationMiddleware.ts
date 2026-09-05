import type { RequestHandler } from "express";
import { BadRequestError } from "hal-response";
import type * as z from "zod";

interface ValidationDetails {
  location: "body" | "params";
  field: string;
  message: string;
}

interface RequestValidationConfig {
  body?: z.ZodType<Record<string, unknown>>;
  params?: z.ZodType<Record<string, string>>;
  errorMessage: string;
}

export const validateRequest = (config: RequestValidationConfig): RequestHandler => {
  return async (req, _res, next): Promise<void> => {
    const bodyResult = config.body ? await config.body.safeParseAsync(req.body) : undefined;
    const paramsResult = config.params ? await config.params.safeParseAsync(req.params) : undefined;

    const details: ValidationDetails[] = [];

    if (bodyResult && !bodyResult.success) {
      details.push(
        ...bodyResult.error.issues.map((issue) => ({
          location: "body" as const,
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    if (paramsResult && !paramsResult.success) {
      details.push(
        ...paramsResult.error.issues.map((issue) => ({
          location: "params" as const,
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    if (details.length > 0) {
      next(new BadRequestError(config.errorMessage, details));
      return;
    }

    if (bodyResult?.success) {
      req.body = bodyResult.data;
    }

    if (paramsResult?.success) {
      req.params = paramsResult.data;
    }

    next();
  };
};
