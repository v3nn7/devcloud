export function requireConfirmation(actionName) {
  return async function confirmationGuard(request, reply) {
    const token = request.headers["x-confirm-action"];
    const expected = `CONFIRM_${actionName}`;

    if (token !== expected) {
      reply.code(400).send({
        message: "Destructive action requires confirmation header",
        requiredHeader: "x-confirm-action",
        expectedValue: expected
      });
    }
  };
}
