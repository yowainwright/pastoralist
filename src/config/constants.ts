import { z } from "zod";

export const CONFIG_FILES = [
  ".pastoralistrc",
  ".pastoralistrc.json",
  "pastoralist.json",
  "pastoralist.config.js",
  "pastoralist.config.ts",
] as const;

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

export const SecurityProviderSchema = z.enum(["osv", "github", "snyk", "npm", "socket"]);

export const SecurityProvidersSchema = z.union([
  SecurityProviderSchema,
  z.array(SecurityProviderSchema)
]);

export const SeverityThresholdSchema = z.enum(["low", "medium", "high", "critical"]);

export const SecurityConfigSchema = z.object({
  enabled: z.boolean().optional(),
  provider: SecurityProvidersSchema.optional(),
  autoFix: z.boolean().optional(),
  interactive: z.boolean().optional(),
  securityProviderToken: z.string().optional(),
  severityThreshold: SeverityThresholdSchema.optional(),
  excludePackages: z.array(z.string()).optional(),
  hasWorkspaceSecurityChecks: z.boolean().optional(),
});

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

export type AppendixItem = z.infer<typeof AppendixItemSchema>;
export type Appendix = z.infer<typeof AppendixSchema>;
export type SecurityProvider = z.infer<typeof SecurityProviderSchema>;
export type SecurityProviders = z.infer<typeof SecurityProvidersSchema>;
export type SeverityThreshold = z.infer<typeof SeverityThresholdSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PastoralistConfig = z.infer<typeof PastoralistConfigSchema>;

export function validateConfig(config: unknown): PastoralistConfig {
  return PastoralistConfigSchema.parse(config);
}

export function safeValidateConfig(config: unknown): PastoralistConfig | undefined {
  const result = PastoralistConfigSchema.safeParse(config);
  if (result.success) {
    return result.data;
  }
  return undefined;
}
