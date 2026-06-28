export const createTestEmail = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID()}@test.local`;
