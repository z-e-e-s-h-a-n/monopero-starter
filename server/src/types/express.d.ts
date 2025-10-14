import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      roles: UserRole[];
    }
  }
}
