// lib/AsyncHandler.ts
import type { Request, Response, NextFunction } from 'express';

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    //                                 ✅ This is KEY: passes error to Express
  };
};

export { asyncHandler };