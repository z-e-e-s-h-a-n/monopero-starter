import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { LoggerService } from "@/modules/logger/logger.service";
import { InjectLogger } from "@/common/decorators/logger.decorator";
import { UserRole } from "@prisma/client";

@Injectable()
export class RoleService {
  @InjectLogger()
  private readonly logger!: LoggerService;

  constructor(private readonly prisma: PrismaService) {}

  /** Assign a role to a user */
  async assignRole(userId: string, role: UserRole) {
    const existing = await this.prisma.roleAssignment.findFirst({
      where: { userId, role },
    });

    if (existing) {
      throw new BadRequestException(`User already has role '${role}'.`);
    }

    const newRole = await this.prisma.roleAssignment.create({
      data: { userId, role },
    });

    this.logger.log(`✅ Role '${role}' assigned to user ${userId}`, {
      userId,
      role,
    });

    return {
      message: `Role '${role}' assigned successfully.`,
      data: { newRole },
    };
  }

  /** Revoke a role from a user */
  async revokeRole(userId: string, role: UserRole) {
    const roleRecord = await this.prisma.roleAssignment.findFirst({
      where: { userId, role },
    });

    if (!roleRecord) {
      throw new BadRequestException(`User does not have role '${role}'.`);
    }

    await this.prisma.roleAssignment.delete({
      where: { id: roleRecord.id },
    });

    this.logger.log(`🚫 Role '${role}' revoked from user ${userId}`, {
      userId,
      role,
    });

    return { message: `Role '${role}' revoked successfully.` };
  }

  /** Get all roles for a user */
  async getUserRoles(userId: string) {
    const roles = await this.prisma.roleAssignment.findMany({
      where: { userId },
      select: { role: true },
    });

    const list = roles.map((r) => r.role);

    return {
      message: `Roles fetched successfully.`,
      data: { userId, roles: list },
    };
  }

  /** Check if user has specific role */
  async hasRole(userId: string, role: UserRole) {
    const existing = await this.prisma.roleAssignment.findFirst({
      where: { userId, role },
    });
    return !!existing;
  }

  /** Update user's roles in bulk (sync) */
  async syncRoles(userId: string, roles: UserRole[]) {
    await this.prisma.roleAssignment.deleteMany({ where: { userId } });

    await this.prisma.roleAssignment.createMany({
      data: roles.map((r) => ({ userId, role: r })),
    });

    this.logger.log(`🔄 Roles synced for user ${userId}`, {
      userId,
      roles,
    });

    return { message: "User roles synced successfully.", data: { roles } };
  }
}
