export function isPostgresUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

export function postgresErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
