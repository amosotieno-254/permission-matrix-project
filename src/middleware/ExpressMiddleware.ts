import { Request, Response, NextFunction } from "express";
import {
  NormalizedMatrix,
  EnforceOptions,
  User,
  Resource,
} from "../types/index.js";
import { can } from "../engine/DecisionEngine.js";
import { ForbiddenError } from "../errors.js";

export function enforce(matrix: NormalizedMatrix, options: EnforceOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = (req as any).user as User | undefined;
      if (!user) {
        throw new ForbiddenError("User not authenticated");
      }

      const ownerId = await options.getResourceOwner(req);

      const resource: Resource = {
        id: req.params.id || req.body.id || "unknown",
        type: options.resourceType,
        ownerId: ownerId,
      };

      const allowed = can(matrix, user, options.action, resource);

      if (!allowed) {
        throw new ForbiddenError(
          `User ${user.id} is not allowed to ${options.action} ${options.resourceType}`,
        );
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}
