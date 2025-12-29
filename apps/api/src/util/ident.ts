export function assertTenantSlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(s)) {
    throw new Error("Invalid tenant slug (use lowercase letters, digits, hyphen; max 32 chars)");
  }
  return s;
}

export function assertSqlIdentifier(ident: string): string {
  const s = ident.trim();
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(s)) {
    throw new Error("Invalid SQL identifier");
  }
  return s;
}

export function quoteIdent(ident: string): string {
  const s = assertSqlIdentifier(ident);
  return `"${s}"`;
}


