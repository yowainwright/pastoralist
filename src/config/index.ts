import { z } from "zod";

/**
 * Appendix item schema
 */
export const AppendixItemSchema = z.object({
  rootDeps: z.array(z.string()).optional(),
  dependents: z.record(z.string(), z.string()).optional(),
  patches: z.array(z.string()).optional(),
  ledger: z.object({
    addedDate: z.string(),
    reason: z.string().optional(),
    securityChecked: z.boolean().optional(),
    securityCheckDate: z.string().optional(),
    securityProvider: z.enum(["osv", "github", "snyk", "npm", "socket"]).optional(),
  }).optional(),
});

export const AppendixSchema = z.record(z.string(), AppendixItemSchema);

/**
 * Security provider schema
 */
export const SecurityProviderSchema = z.enum(["osv", "github", "snyk", "npm", "socket"]);

/**
 * Severity threshold schema
 */
export const SeverityThresholdSchema = z.enum(["low", "medium", "high", "critical"]);

/**
 * Security configuration schema
 */
export const SecurityConfigSchema = z.object({
  enabled: z.boolean().optional(),
  provider: SecurityProviderSchema.optional(),
  autoFix: z.boolean().optional(),
  interactive: z.boolean().optional(),
  securityProviderToken: z.string().optional(),
  severityThreshold: SeverityThresholdSchema.optional(),
  excludePackages: z.array(z.string()).optional(),
  hasWorkspaceSecurityChecks: z.boolean().optional(),
});

/**
 * Pastoralist configuration schema
 */
export const PastoralistConfigSchema = z.object({
  appendix: AppendixSchema.optional(),
  depPaths: z.union([
    z.literal("workspace"),
    z.literal("workspaces"),
    z.array(z.string()),
  ]).optional(),
  checkSecurity: z.boolean().optional(),
  overridePaths: z.record(z.string(), AppendixSchema).optional(),
  resolutionPaths: z.record(z.string(), AppendixSchema).optional(),
  security: SecurityConfigSchema.optional(),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type AppendixItem = z.infer<typeof AppendixItemSchema>;
export type Appendix = z.infer<typeof AppendixSchema>;
export type SecurityProvider = z.infer<typeof SecurityProviderSchema>;
export type SeverityThreshold = z.infer<typeof SeverityThresholdSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PastoralistConfig = z.infer<typeof PastoralistConfigSchema>;

/**
 * Validate and parse pastoralist configuration
 */
export function validateConfig(config: unknown): PastoralistConfig {
  return PastoralistConfigSchema.parse(config);
}

/**
 * Safely validate and parse configuration, returning undefined on error
 */
export function safeValidateConfig(config: unknown): PastoralistConfig | undefined {
  const result = PastoralistConfigSchema.safeParse(config);
  if (result.success) {
    return result.data;
  }
  return undefined;
}
