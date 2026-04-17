import { createHttpError, sendError } from "../utils/httpResponse.js";

const toAuthenticatedUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  nationality: user.nationality,
  role: user.role,
});

const parseBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw createHttpError(401, "Missing or invalid authorization token");
  }

  return token;
};

export const createAuthMiddleware = ({ prisma, authUtils }) => {
  const requireAuth = async (req, res, next) => {
    try {
      const token = parseBearerToken(req.headers.authorization);

      let payload;
      try {
        payload = authUtils.verifyToken(token);
      } catch {
        throw createHttpError(401, "Invalid or expired token");
      }

      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw createHttpError(401, "Invalid token payload");
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw createHttpError(401, "User account no longer exists");
      }

      req.user = toAuthenticatedUser(user);
      return next();
    } catch (error) {
      return sendError(res, error);
    }
  };

  const requireRole = (roles = []) => (req, res, next) => {
    if (!req.user) {
      return sendError(res, createHttpError(401, "Authentication is required"));
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, createHttpError(403, "Insufficient permissions"));
    }

    return next();
  };

  return {
    requireAuth,
    requireRole,
  };
};