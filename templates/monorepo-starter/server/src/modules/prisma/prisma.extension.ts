import { Prisma } from "@generated/prisma";
import { SoftDeleteModels } from "./soft-delete.models";

const hasDeletedAt = (model: string) => SoftDeleteModels.has(model);

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",

  query: {
    $allModels: {
      async delete({ model, args, query }) {
        const hasDel = hasDeletedAt(model);
        const force = (args as any).force;

        if (hasDel && !force) {
          const prisma = Prisma.getExtensionContext(this);
          return (prisma as any)[model].update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }

        return query(args);
      },

      async deleteMany({ model, args, query }) {
        const hasDel = hasDeletedAt(model);
        const force = (args as any).force;

        if (hasDel && !force) {
          const prisma = Prisma.getExtensionContext(this);
          return (prisma as any)[model].updateMany({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }

        return query(args);
      },

      async $allOperations({ model, operation, args, query }) {
        const hasDel = hasDeletedAt(model);
        const _args = { ...(args as Record<string, any>) };
        const targetOps = ["findFirst", "findMany", "count", "aggregate"];

        if (!targetOps.includes(operation) || !hasDel) return query(args);

        if (_args.includeDeleted) {
          delete _args.includeDeleted;
          return query(_args);
        }

        _args.where = _args.where ?? {};
        if (!("deletedAt" in _args.where)) {
          _args.where = { ..._args.where, deletedAt: null };
        }

        return query(_args);
      },
    },
  },
});
