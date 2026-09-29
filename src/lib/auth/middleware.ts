import { AnyZodObject, ZodError } from "zod";
import { CustomError } from "./errors.js";

export const validateRequest = (schema: any) =>
  async (req: any, res: any, next: Function): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return next(CustomError.badRequest(messages));
      }
      throw error;
    }
  };