#!/usr/bin/env bun

import { readFileSync } from 'fs';

console.log('🐑 Pastoralist Interactive Config Review Demo\n');
console.log('='.repeat(60));

console.log(`
This demo shows the interactive config review functionality:
- Review and modify workspace configuration
- Update security settings
- View and remove overrides
- View and remove resolutions
- Review all configuration at once
`);

try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

  console.log('📋 Current State:');
  if (pkg.pastoralist) {
    console.log('\n✅ Pastoralist configured:');

    if (pkg.pastoralist.depPaths) {
      const depPaths = pkg.pastoralist.depPaths;
      if (depPaths === "workspace") {
        console.log('   • Workspace tracking: enabled (auto-detect)');
      } else if (Array.isArray(depPaths)) {
        console.log(`   • Workspace tracking: enabled`);
        console.log(`     Paths: ${depPaths.join(", ")}`);
      }
    } else {
      console.log('   • Workspace tracking: not configured');
    }

    if (pkg.pastoralist.checkSecurity || pkg.pastoralist.security?.enabled) {
      console.log('   • Security scanning: enabled');
      if (pkg.pastoralist.security) {
        console.log(`     Provider: ${pkg.pastoralist.security.provider || "osv"}`);
        console.log(`     Interactive: ${pkg.pastoralist.security.interactive ? "yes" : "no"}`);
        console.log(`     Auto-fix: ${pkg.pastoralist.security.autoFix ? "yes" : "no"}`);
        if (pkg.pastoralist.security.severityThreshold) {
          console.log(`     Threshold: ${pkg.pastoralist.security.severityThreshold}`);
        }
      }
    } else {
      console.log('   • Security scanning: not configured');
    }

    const npmOverrides = pkg.overrides || {};
    const pnpmOverrides = pkg.pnpm?.overrides || {};
    const totalOverrides = Object.keys(npmOverrides).length + Object.keys(pnpmOverrides).length;
    console.log(`   • Overrides: ${totalOverrides}`);

    const resolutions = pkg.resolutions || {};
    console.log(`   • Resolutions: ${Object.keys(resolutions).length}`);
  } else {
    console.log('\n⚠️  Not configured yet (run "bun run real" to set up)');
  }
} catch (error) {
  console.error('Error reading package.json:', error);
}

console.log(`
🚀 Commands to try:
   bun start            - Show this demo
   bun run interactive  - Run simulated interactive review
   bun run real         - Run actual pastoralist --interactive

Interactive mode lets you:
   • Enable/disable workspace tracking
   • Change workspace paths
   • Enable/disable security scanning
   • Change security provider and settings
   • View and remove specific overrides
   • View and remove specific resolutions
   • Review all configuration at once

💡 Tips:
   - Changes aren't saved until you confirm
   - You can back out of any section
   - Use "Review all" to see everything at once
   - Exit anytime with the exit option
`);
