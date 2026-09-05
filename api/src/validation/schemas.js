const { z } = require("zod");

// Shared by /auth/register and /auth/login. Rejecting non-string/malformed
// bodies here — before any field is touched by route logic — is what stops a
// non-string email from throwing a raw TypeError inside an async handler.
const credentialsSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

module.exports = { credentialsSchema };
