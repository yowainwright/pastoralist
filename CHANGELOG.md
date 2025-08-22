# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full support for nested overrides (transitive dependency overrides)
  - Can now override dependencies of dependencies using npm's nested override syntax
  - Example: `"pg": { "pg-types": "^4.0.1" }` overrides pg's pg-types dependency
  - Nested overrides are tracked in appendix with "(nested override)" notation
  - Properly handles cleanup - only removes nested overrides when parent package is removed
  - Works across monorepo workspaces with `--depPaths` option

### Fixed
- Fixed bug where nested overrides were incorrectly rejected as "complex overrides"
- Fixed issue where overrides for packages in workspace dependencies (not root) were being removed

### Changed
- Updated type definitions to support nested override structure
- Enhanced `updateAppendix` function to handle both simple and nested overrides
- Improved `findUnusedOverrides` to correctly identify when nested overrides are still needed

## [1.4.0] - Previous Release

### Added
- Patch detection and tracking support
- PeerDependencies support
- Smart cleanup notifications for unused patches
- Workspace and monorepo support improvements

### Fixed
- Appendix preservation when overrides are removed
- Cross-package dependency tracking in workspaces