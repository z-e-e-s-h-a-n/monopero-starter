import { UserRole } from "@generated/prisma";

declare global {
  namespace Express {
    interface User {
      id: string;
      roles: UserRole[];
    }
  }
}
