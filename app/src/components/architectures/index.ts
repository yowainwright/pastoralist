import { lazy } from "react";

export const CoreArchitecture = lazy(() => import("./CoreArchitecture"));
export const CoreArchitectureSimple = lazy(() => import("./CoreArchitectureSimple"));
export const SimpleProjectArchitecture = lazy(() => import("./SimpleProjectArchitecture"));
export const MonorepoArchitecture = lazy(() => import("./MonorepoArchitecture"));
export const SecurityVulnerabilityManagement = lazy(() => import("./SecurityVulnerabilityManagement"));
export const PatchManagementArchitecture = lazy(() => import("./PatchManagementArchitecture"));
export const CICDIntegration = lazy(() => import("./CICDIntegration"));
export const NestedOverrideArchitecture = lazy(() => import("./NestedOverrideArchitecture"));
export const DependencyResolutionFlow = lazy(() => import("./DependencyResolutionFlow"));