-- NextAuth Azure AD returns ext_expires_in; keep schema compatible with Prisma adapter.
ALTER TABLE auth_accounts
ADD COLUMN IF NOT EXISTS ext_expires_in INT;


