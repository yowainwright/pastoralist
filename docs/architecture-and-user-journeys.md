# Architecture and User Journeys

This doc shows how Pastoralist works: the architecture, code flows, and common user journeys.

---

## 1. Architecture

### 1.1 Core Architecture

Pastoralist runs after npm install, analyzes your overrides, and maintains tracking automatically.

```mermaid
flowchart TB
    subgraph Input
        PkgJson[package.json]
        NodeModules[node_modules]
        Patches[patches/]
    end

    subgraph PastoralistCore [Pastoralist Core]
        Parser[Override Parser]
        Analyzer[Dependency Analyzer]
        Tracker[Usage Tracker]
        Cleaner[Cleanup Engine]
        Security[Security Scanner]
    end

    subgraph Output
        UpdatedPkg[Updated package.json]
        Appendix[pastoralist.appendix]
        Report[Console Report]
    end

    PkgJson --> Parser
    NodeModules --> Analyzer
    Patches --> Tracker

    Parser --> Analyzer
    Analyzer --> Tracker
    Tracker --> Cleaner
    Analyzer --> Security

    Cleaner --> UpdatedPkg
    Tracker --> Appendix
    Security --> Report
    Cleaner --> Report

    style Parser fill:#e3f2fd
    style Analyzer fill:#e1f5e1
    style Tracker fill:#fff3e0
    style Cleaner fill:#ffebee
    style Security fill:#f3e5f5
```

**Code References:**

| Component | Location | Function |
|-----------|----------|----------|
| Parser | `src/scripts.ts:463-489` | Override parsing |
| Analyzer | `src/scripts.ts:636-745` | Dependency analysis |
| Tracker | `src/scripts.ts:893-937` | Appendix tracking |
| Cleaner | `src/scripts.ts:212-266, 1290-1345` | Cleanup |
| Security | `src/security/index.ts:188-248` | Scanning |

---

### 1.2 Simple Project Architecture

For single-package projects, Pastoralist tracks what each override fixes.

```mermaid
flowchart LR
    subgraph YourProject [Your Project]
        A[package.json<br/>dependencies]
        B[overrides/<br/>resolutions]
    end

    subgraph Dependencies
        C[Direct<br/>Dependencies]
        D[Transitive<br/>Dependencies]
    end

    subgraph PastoralistMgmt [Pastoralist Management]
        E[pastoralist<br/>appendix]
        F[Tracking &<br/>Documentation]
    end

    A --> C
    C --> D
    B -.->|Forces version| D
    B --> E
    E --> F
    F -.->|Removes if unused| B

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style E fill:#e1f5e1
    style F fill:#fff3e0
```

---

### 1.3 Monorepo Architecture

For monorepos, Pastoralist auto-detects workspaces and tracks which packages need each override.

```mermaid
flowchart TD
    subgraph RootLevel [Root Level]
        RootPkg[Root package.json]
        RootOverrides[Global Overrides]
    end

    subgraph WorkspaceA [Workspace A]
        PkgA[packages/app-a<br/>package.json]
        DepsA[Dependencies]
    end

    subgraph WorkspaceB [Workspace B]
        PkgB[packages/app-b<br/>package.json]
        DepsB[Dependencies]
    end

    subgraph WorkspaceC [Workspace C]
        PkgC[packages/lib<br/>package.json]
        DepsC[Dependencies]
    end

    subgraph PastoralistTracking [Pastoralist Tracking]
        OverridePaths[overridePaths]
        AppendixA[Appendix for app-a]
        AppendixB[Appendix for app-b]
        AppendixC[Appendix for lib]
    end

    RootPkg --> RootOverrides
    RootOverrides -.->|Applies to| PkgA
    RootOverrides -.->|Applies to| PkgB
    RootOverrides -.->|Applies to| PkgC

    PkgA --> DepsA
    PkgB --> DepsB
    PkgC --> DepsC

    DepsA --> AppendixA
    DepsB --> AppendixB
    DepsC --> AppendixC

    AppendixA --> OverridePaths
    AppendixB --> OverridePaths
    AppendixC --> OverridePaths

    style RootOverrides fill:#f3e5f5
    style OverridePaths fill:#e1f5e1
```

---

### 1.4 Security Vulnerability Management

Security scanning finds vulnerabilities, generates overrides, and tracks them with CVE details.

```mermaid
flowchart TD
    Start([pastoralist --checkSecurity])

    subgraph ScanningPhase [Scanning Phase]
        CollectDeps[Collect all<br/>dependencies]
        QueryOSV[Query OSV<br/>database]
        AnalyzeVuln[Analyze<br/>vulnerabilities]
    end

    subgraph DecisionPhase [Decision Phase]
        CheckSeverity{Above<br/>threshold?}
        CheckMode{Fix mode?}
    end

    subgraph FixActions [Fix Actions]
        AutoFix[Generate all<br/>override fixes]
        Interactive[Show options<br/>to user]
        UserSelect[User selects<br/>fixes]
    end

    subgraph Application
        ApplyOverrides[Add security<br/>overrides]
        UpdateAppendix[Update<br/>appendix]
        CreateBackup[Create<br/>backup]
    end

    Start --> CollectDeps
    CollectDeps --> QueryOSV
    QueryOSV --> AnalyzeVuln
    AnalyzeVuln --> CheckSeverity

    CheckSeverity -->|Yes| CheckMode
    CheckSeverity -->|No| End([No action needed])

    CheckMode -->|Auto| AutoFix
    CheckMode -->|Interactive| Interactive
    CheckMode -->|Report only| Report[Generate<br/>report]

    Interactive --> UserSelect
    UserSelect --> ApplyOverrides
    AutoFix --> ApplyOverrides

    ApplyOverrides --> CreateBackup
    CreateBackup --> UpdateAppendix
    UpdateAppendix --> Success([Fixed!])
    Report --> End

    style Start fill:#ffebee
    style QueryOSV fill:#fff3e0
    style AutoFix fill:#c8e6c9
    style Interactive fill:#bbdefb
    style ApplyOverrides fill:#e1f5e1
```

---

### 1.5 CI/CD Integration

Run `pastoralist init-ci` to generate GitHub Actions workflow for automated checks.

```mermaid
flowchart LR
    subgraph CIPipeline [CI Pipeline]
        Trigger[Push/PR<br/>Trigger]
        Install[npm install]
        RunPastoralist[Run<br/>pastoralist]
        CheckDiff{Changes<br/>detected?}
    end

    subgraph Actions
        FailBuild[Fail build<br/>Uncommitted changes]
        PassBuild[Continue<br/>pipeline]
        SecurityCheck[Security<br/>scan]
    end

    subgraph Notifications
        Alert[Alert team:<br/>Overrides need update]
        Report[Generate<br/>override report]
    end

    Trigger --> Install
    Install --> RunPastoralist
    RunPastoralist --> CheckDiff

    CheckDiff -->|Yes| FailBuild
    CheckDiff -->|No| PassBuild

    FailBuild --> Alert
    PassBuild --> SecurityCheck

    SecurityCheck --> Report

    style Trigger fill:#fff3e0
    style RunPastoralist fill:#e3f2fd
    style FailBuild fill:#ffebee
    style PassBuild fill:#c8e6c9
    style SecurityCheck fill:#f3e5f5
```

**Generated Workflow Example:**

```yaml
name: Pastoralist Security Check
on:
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'
jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Pastoralist security check
        run: npx pastoralist --checkSecurity
```

---

### 1.6 Override Lifecycle

Overrides are tracked from creation to automatic removal when no longer needed.

```mermaid
stateDiagram-v2
    [*] --> Identified: Security issue or version conflict identified

    Identified --> Added: Developer adds override to package.json

    Added --> Tracked: pastoralist creates appendix entry

    Tracked --> Active: Override is actively fixing issues

    Active --> Monitored: Continuous monitoring via pastoralist

    Monitored --> Updated: Dependencies change, override updated
    Updated --> Tracked

    Monitored --> Obsolete: Original issue fixed upstream

    Obsolete --> Removed: pastoralist removes override automatically

    Removed --> [*]

    note right of Tracked
        Appendix documents:
        - Which packages need it
        - Why it exists
        - Related patches
    end note

    note right of Monitored
        Regular checks via:
        - postinstall hooks
        - CI/CD pipeline
        - Manual runs
    end note

    note right of Obsolete
        Detected when:
        - No dependents need it
        - Security issue resolved
        - Version conflict gone
    end note
```

---

## 2. Code Flows

### 2.1 Override Tracking Flow

Every override is automatically tracked with which packages need it and why it exists.

```mermaid
flowchart TD
    Start([Start]) --> Find[Find overrides/resolutions<br/>in package.json]
    Find --> Review[Review dependencies<br/>Compare with appendix]
    Review --> Decision{Changes needed?}
    Decision -->|New overrides| Add[Add to<br/>pastoralist.appendix]
    Decision -->|Unused overrides| Remove[Remove from overrides<br/>and appendix]
    Decision -->|No changes| End([End])
    Add --> End
    Remove --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Find fill:#e3f2fd
    style Review fill:#e3f2fd
    style Add fill:#f3e5f5
    style Remove fill:#f3e5f5
```

**Code Execution Path:**

```
program.ts:50 action()
  ↓
scripts.ts:463 update()
  ↓
scripts.ts:470 determineDepPaths() [workspace auto-detection]
  ↓
scripts.ts:636 updatePackageJSON()
  ↓
scripts.ts:893 createSecurityLedger() [enhanced with CVE details]
  ↓
scripts.ts:745 writeFileSync() or dryRun console.log
```

---

### 2.2 Security Scanning Flow

Security scanning runs on every install, checks for newer patches, and tracks full CVE details in the ledger.

```mermaid
flowchart TD
    Start([checkSecurity enabled]) --> Collect[Collect all<br/>dependencies]
    Collect --> Query[Query OSV<br/>database]
    Query --> Check[Check for<br/>newer patches]
    Check --> Analyze[Analyze<br/>severity]
    Analyze --> Generate[Generate<br/>overrides]
    Generate --> Track[Track CVE details<br/>in ledger]
    Track --> End([Complete])

    style Start fill:#ffebee
    style Query fill:#fff3e0
    style Generate fill:#c8e6c9
    style Track fill:#e1f5e1
```

**Code Execution Path:**

```
program.ts:90 if (mergedOptions.checkSecurity)
  ↓
security/index.ts:105 checkSecurity()
  ↓
security/index.ts:188 checkOverrideUpdates() [NEW: detects newer patches]
  ↓
security/providers/osv.ts:45 fetchAlerts() [parallel API calls]
  ↓
security/index.ts:418 generateOverrides() [with CVE, severity, description, url]
  ↓
program.ts:116 securityOverrideDetails → scripts.ts:893
```

---

### 2.3 Workspace Auto-Detection Flow

Workspaces are auto-detected from package.json; no configuration needed.

```mermaid
flowchart TD
    Start([pastoralist runs]) --> Check{Has workspaces<br/>field?}
    Check -->|Yes| NoConfig{Config<br/>depPaths set?}
    Check -->|No| Manual[Use manual config<br/>or current dir]
    NoConfig -->|No| Auto[Auto-detect:<br/>Map workspaces to paths]
    NoConfig -->|Yes| Use[Use configured<br/>depPaths]
    Auto --> Scan[Scan all<br/>workspace packages]
    Use --> Scan
    Manual --> End([Complete])
    Scan --> End

    style Start fill:#e3f2fd
    style Auto fill:#c8e6c9
    style Scan fill:#e1f5e1
```

**Code Execution Path:**

```
scripts.ts:463 update()
  ↓
scripts.ts:470-478 Auto-detection logic:
  - Check if depPaths is undefined
  - Check if package.json has workspaces field
  - Check if config.pastoralist.depPaths is NOT set
  ↓
scripts.ts:475 Map workspaces to package.json paths:
  depPaths = config.workspaces!.map((ws: string) => `${ws}/package.json`)
  ↓
scripts.ts:636 updatePackageJSON() for each workspace
```

---

### 2.4 Cleanup Flow

When dependencies are removed, their overrides are automatically cleaned up.

```mermaid
flowchart TD
    Start([Dependency removed]) --> Check[Check appendix<br/>for dependents]
    Check --> Has{Has remaining<br/>dependents?}
    Has -->|No| Remove[Remove from<br/>overrides]
    Has -->|Yes| Keep[Keep override]
    Remove --> Clean[Remove from<br/>appendix]
    Clean --> Write[Update<br/>package.json]
    Write --> End([Cleaned up])
    Keep --> End

    style Start fill:#e3f2fd
    style Remove fill:#f3e5f5
    style Clean fill:#ffebee
    style End fill:#e1f5e1
```

**Code Execution Path:**

```
scripts.ts:212 cleanupUnusedOverrides()
  ↓
scripts.ts:221 Check if override has dependents
  ↓
scripts.ts:245 Remove from overrides object
  ↓
scripts.ts:1290 removeUnusedOverrides()
  ↓
scripts.ts:1345 Update package.json
```

---

## 3. User Journeys

### 3.1 First-Time Setup

Install it. Run `pastoralist --init`. Add to postinstall. Never think about it again.

```mermaid
flowchart LR
    Install[npm install<br/>pastoralist -D] --> Init[pastoralist<br/>--init]
    Init --> Configure[Interactive<br/>setup]
    Configure --> Postinstall[Add to<br/>postinstall]
    Postinstall --> Done[Done!]

    style Install fill:#e3f2fd
    style Init fill:#f3e5f5
    style Configure fill:#fff3e0
    style Done fill:#c8e6c9
```

**.pastoralistrc:**

```json
{
  "checkSecurity": true,
  "security": {
    "enabled": true,
    "provider": "osv"
  }
}
```

**package.json:**

```json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

---

### 3.2 Security Patch Management

A CVE drops. Pastoralist fixes it, tracks every detail, and removes it when upstream patches. You keep coding.

```mermaid
flowchart LR
    CVE[CVE<br/>Announced] --> Check[Run security<br/>check]
    Check --> Found{Affected?}
    Found -->|Yes| Override[Add security<br/>override]
    Found -->|No| Safe[No action]
    Override --> Track[Pastoralist<br/>tracks]
    Track --> Wait[Wait for<br/>upstream fix]
    Wait --> Fixed{Fixed<br/>upstream?}
    Fixed -->|Yes| Remove[Pastoralist<br/>removes override]
    Fixed -->|No| Keep[Keep override]

    style CVE fill:#ffebee
    style Override fill:#f3e5f5
    style Track fill:#e1f5e1
    style Remove fill:#c8e6c9
```

**.pastoralistrc:**

```json
{
  "checkSecurity": true,
  "security": {
    "enabled": true,
    "provider": "osv",
    "severityThreshold": "medium",
    "autoFix": true
  }
}
```

**Resulting package.json appendix:**

```json
{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "ledger": {
          "reason": "Security vulnerability CVE-2021-23337",
          "cve": "CVE-2021-23337",
          "severity": "high",
          "description": "Command injection in lodash",
          "url": "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
          "securityProvider": "osv"
        }
      }
    }
  }
}
```

---

### 3.3 Monorepo Migration

Add a `workspaces` field. Run `pastoralist`. It auto-detects everything. That's it.

```mermaid
flowchart LR
    Add[Add workspaces<br/>to package.json] --> Run[Run<br/>pastoralist]
    Run --> Detect[Auto-detect<br/>all workspaces]
    Detect --> Track[Track per<br/>workspace]
    Track --> Done[Done!]

    style Add fill:#e3f2fd
    style Detect fill:#c8e6c9
    style Track fill:#e1f5e1
    style Done fill:#c8e6c9
```

**.pastoralistrc:**

```json
{
  "depPaths": "workspace"
}
```

**Alternative - explicit paths:**

```json
{
  "depPaths": ["packages/*/package.json", "apps/*/package.json"]
}
```

**package.json:**

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  }
}
```

---

### 3.4 CI/CD Setup

One command generates your CI workflow. Automated security checks on every PR and weekly scans.

```mermaid
flowchart LR
    Run[pastoralist<br/>init-ci] --> Generate[Generate<br/>workflow file]
    Generate --> Review[Review<br/>.github/workflows]
    Review --> Commit[Commit<br/>workflow]
    Commit --> Auto[Automated checks<br/>on every PR]

    style Run fill:#e3f2fd
    style Generate fill:#c8e6c9
    style Auto fill:#e1f5e1
```

**Command:**

```bash
pastoralist init-ci
```

**Generated workflow:**

```yaml
name: Pastoralist Security Check

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
      - name: Detect package manager
        id: detect
      - name: Install dependencies
      - name: Run Pastoralist security check
        run: npx pastoralist --checkSecurity
      - name: Check for uncommitted changes
      - name: Comment on PR
```

---

### 3.5 Breaking Change Management

Lock a version while you migrate. Pastoralist tracks which packages still need it. When all are updated, it auto-removes the override.

```mermaid
flowchart LR
    Breaking[Major version<br/>with breaking changes] --> Incompatible[Some packages<br/>incompatible]
    Incompatible --> AddOverride[Add override for<br/>old version]
    AddOverride --> Document[Pastoralist<br/>documents usage]
    Document --> Migrate[Gradually migrate<br/>packages]
    Migrate --> AllUpdated{All packages<br/>updated?}
    AllUpdated -->|Yes| AutoRemove[Pastoralist removes<br/>override]
    AllUpdated -->|No| KeepTracking[Continue<br/>tracking]

    style Breaking fill:#fff3e0
    style AddOverride fill:#f3e5f5
    style Document fill:#e1f5e1
    style AutoRemove fill:#c8e6c9
```

**.pastoralistrc:**

```json
{
  "depPaths": "workspace"
}
```

**package.json:**

```json
{
  "overrides": {
    "react": "^17.0.2"
  },
  "pastoralist": {
    "appendix": {
      "react@^17.0.2": {
        "dependents": {
          "old-package-a": "react@^17.0.0",
          "old-package-b": "react@^17.0.0"
        }
      }
    }
  }
}
```

---

### 3.6 Dry-Run Preview

Not sure what Pastoralist will do? Run `--dry-run` to preview. No files touched.

```mermaid
flowchart LR
    Unsure[Unsure about<br/>changes?] --> DryRun[Run with<br/>--dry-run]
    DryRun --> Preview[Preview changes<br/>in console]
    Preview --> Review[Review output]
    Review --> Decide{Looks good?}
    Decide -->|Yes| Apply[Run without<br/>--dry-run]
    Decide -->|No| Adjust[Adjust config]
    Apply --> Done[Changes applied]
    Adjust --> DryRun

    style Unsure fill:#fff3e0
    style DryRun fill:#e3f2fd
    style Preview fill:#f3e5f5
    style Done fill:#c8e6c9
```

**Command:**

```bash
pastoralist --dry-run
```

**Output preview:**

```
[DRY RUN] Would write to package.json:
{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        }
      }
    }
  }
}
```
