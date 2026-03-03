export function requireRole(allowedRoles) {
  return async function roleGuard(request, reply) {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      reply.code(403).send({ message: "Forbidden: insufficient role" });
    }
  };
}
