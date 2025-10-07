import type { UserModel } from "./models/user.model";
import "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel; // or you can just use `any` if you're unsure
    }
  }
}

declare module "jsonwebtoken" {
  export interface JwtPayload {
    user: { _id?: string; email?: string; iat?: number };
  }
}
