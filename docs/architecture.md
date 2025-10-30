# Pastoralist Architecture & Use Cases

This document describes the various architectures and scenarios where Pastoralist helps manage package overrides and resolutions.

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Simple Project Architecture](#simple-project-architecture)
3. [Monorepo Architecture](#monorepo-architecture)
4. [Security Vulnerability Management](#security-vulnerability-management)
5. [Patch Management Architecture](#patch-management-architecture)
6. [Nested Override Architecture](#nested-override-architecture)
7. [CI/CD Integration](#cicd-integration)
8. [Dependency Resolution Flow](#dependency-resolution-flow)
9. [Override Lifecycle](#override-lifecycle)

## Core Architecture

How Pastoralist processes and manages overrides internally:

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

## Simple Project Architecture

Standard single-package project with overrides:

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

## Monorepo Architecture

Complex workspace setup with shared overrides:

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

## Security Vulnerability Management

How Pastoralist handles security scanning and fixes:

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

## Patch Management Architecture

Integration with patch-package and similar tools:

```mermaid
flowchart LR
    subgraph PatchSources [Patch Sources]
        PatchPkg[patch-package]
        Manual[Manual patches]
        Generated[Generated<br/>patches]
    end

    subgraph PatchFiles [Patch Files]
        PatchDir[patches/]
        PatchFiles[*.patch files]
    end

    subgraph PastoralistTrack [Pastoralist Tracking]
        DetectPatches[Detect patches]
        LinkPatches[Link to<br/>dependencies]
        TrackUsage[Track usage]
    end

    subgraph Appendix
        AppendixEntry[Package entry]
        PatchRef[Patch references]
        Dependents[Dependent packages]
    end

    PatchPkg --> PatchDir
    Manual --> PatchDir
    Generated --> PatchDir

    PatchDir --> PatchFiles
    PatchFiles --> DetectPatches

    DetectPatches --> LinkPatches
    LinkPatches --> TrackUsage

    TrackUsage --> AppendixEntry
    AppendixEntry --> PatchRef
    AppendixEntry --> Dependents

    style PatchDir fill:#fff3e0
    style DetectPatches fill:#e3f2fd
    style TrackUsage fill:#e1f5e1
    style AppendixEntry fill:#f3e5f5
```

## Nested Override Architecture

How nested overrides work for transitive dependencies:

```mermaid
flowchart TD
    subgraph YourProj [Your Project]
        YourPkg[your-package]
    end

    subgraph DirectDep [Direct Dependency]
        Express[express@4.18.0]
        PG[pg@8.13.1]
    end

    subgraph TransitiveDeps [Transitive Dependencies]
        Cookie[cookie@0.4.0]
        PGTypes[pg-types@3.0.0]
    end

    subgraph NestedOverrides [Nested Overrides]
        NestedOverride["Overrides:<br/>express.cookie: 0.5.0<br/>pg.pg-types: 4.0.1"]
    end

    subgraph Result
        CookieFixed[cookie@0.5.0<br/>Fixed]
        PGTypesFixed[pg-types@4.0.1<br/>Fixed]
    end

    YourPkg --> Express
    YourPkg --> PG
    Express --> Cookie
    PG --> PGTypes

    NestedOverride -.->|Overrides| Cookie
    NestedOverride -.->|Overrides| PGTypes

    Cookie --> CookieFixed
    PGTypes --> PGTypesFixed

    style YourPkg fill:#e3f2fd
    style NestedOverride fill:#f3e5f5
    style CookieFixed fill:#c8e6c9
    style PGTypesFixed fill:#c8e6c9
```

## CI/CD Integration

How Pastoralist fits into CI/CD pipelines:

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

## Dependency Resolution Flow

Complete flow of how dependencies are resolved with overrides:

```mermaid
flowchart TD
    subgraph PkgInstall [Package Installation]
        NPMInstall[npm/yarn/pnpm<br/>install]
        ReadPkg[Read<br/>package.json]
        ReadLock[Read<br/>lock file]
    end

    subgraph ResolutionProcess [Resolution Process]
        NormalRes[Normal<br/>resolution]
        CheckOverrides{Has<br/>overrides?}
        ApplyOverrides[Apply<br/>overrides]
    end

    subgraph PastoralistProcess [Pastoralist Process]
        PostInstall[postinstall<br/>hook]
        AnalyzeDeps[Analyze<br/>dependencies]
        UpdateAppendix[Update<br/>appendix]
        CleanUnused[Clean<br/>unused]
    end

    subgraph FinalState [Final State]
        NodeModules[node_modules/<br/>with overrides]
        UpdatedPkg[Updated<br/>package.json]
    end

    NPMInstall --> ReadPkg
    ReadPkg --> ReadLock
    ReadLock --> NormalRes
    NormalRes --> CheckOverrides

    CheckOverrides -->|Yes| ApplyOverrides
    CheckOverrides -->|No| NodeModules

    ApplyOverrides --> NodeModules
    NodeModules --> PostInstall

    PostInstall --> AnalyzeDeps
    AnalyzeDeps --> UpdateAppendix
    UpdateAppendix --> CleanUnused
    CleanUnused --> UpdatedPkg

    style NPMInstall fill:#fff3e0
    style ApplyOverrides fill:#f3e5f5
    style PostInstall fill:#e3f2fd
    style UpdateAppendix fill:#e1f5e1
```

## Override Lifecycle

The complete lifecycle of an override from creation to removal:

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

## Interactive Mode Architecture

How interactive mode guides users through configuration:

```mermaid
flowchart TD
    Start([pastoralist --interactive])

    subgraph Detection
        DetectIssues[Detect overrides<br/>without deps]
        CheckWorkspaces[Check for<br/>workspace structure]
    end

    subgraph UserInteraction [User Interaction]
        ShowOptions[Show configuration<br/>options]
        UserChoice{User selects}
    end

    subgraph ConfigOptions [Configuration Options]
        AutoDetect[Auto-detect<br/>workspace paths]
        ManualPaths[Manually specify<br/>paths]
        SkipConfig[Skip<br/>configuration]
    end

    subgraph ApplyConfig [Apply Configuration]
        ScanPaths[Scan selected<br/>paths]
        BuildConfig[Build<br/>configuration]
        SaveConfig[Save to<br/>package.json]
    end

    Start --> DetectIssues
    DetectIssues --> CheckWorkspaces
    CheckWorkspaces --> ShowOptions
    ShowOptions --> UserChoice

    UserChoice -->|Auto| AutoDetect
    UserChoice -->|Manual| ManualPaths
    UserChoice -->|Skip| SkipConfig

    AutoDetect --> ScanPaths
    ManualPaths --> ScanPaths
    ScanPaths --> BuildConfig
    BuildConfig --> SaveConfig

    SaveConfig --> Success([Configuration<br/>complete])
    SkipConfig --> End([Exit])

    style Start fill:#bbdefb
    style ShowOptions fill:#fff3e0
    style AutoDetect fill:#c8e6c9
    style SaveConfig fill:#e1f5e1
```

## Common Use Case Scenarios

### Scenario 1: Security Patch Management

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

### Scenario 2: Breaking Change Management

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

## Summary

Pastoralist provides comprehensive override management across various architectures:

1. **Simple Projects**: Basic override tracking and cleanup
2. **Monorepos**: Complex workspace override management
3. **Security**: Automated vulnerability detection and fixing
4. **Patches**: Integration with patch management tools
5. **CI/CD**: Automated validation and reporting
6. **Lifecycle Management**: Complete override lifecycle tracking

Each architecture benefits from Pastoralist's core features:
- Automatic documentation via appendix
- Usage tracking across dependencies
- Automatic cleanup of unused overrides
- Security vulnerability scanning
- Interactive configuration for complex setups