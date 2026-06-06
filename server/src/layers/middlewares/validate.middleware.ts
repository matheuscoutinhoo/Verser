import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject | ZodTypeAny, target: Target = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    Object.assign(req[target] as Record<string, unknown>, result.data);
    next();
  };
}
