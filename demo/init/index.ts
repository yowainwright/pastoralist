#!/usr/bin/env bun

import { readFileSync } from 'fs';

console.log('🐑 Pastoralist Init Command Demo\n');
console.log('='.repeat(60));

console.log(`
This demo shows the init command functionality:
- Interactive configuration wizard
- Choose config location (package.json or external file)
- Set up workspace tracking
- Configure security scanning
- All options can be skipped

📦 What gets configured:
   • Workspace dependency tracking
   • Security vulnerability scanning
   • Security provider selection
   • Interactive or auto-fix modes
   • Severity thresholds
   • Workspace security checks
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
  } else {
    console.log('\n⚠️  Not configured yet (run "bun run init" to set up)');
  }
} catch (error) {
  console.error('Error reading package.json:', error);
}

console.log(`
🚀 Commands to try:
   bun start       - Show this demo
   bun run init    - Run simulated init wizard
   bun run real    - Run actual pastoralist init

The init wizard guides you through:
   1. Config location (package.json vs external file)
   2. Workspace dependency tracking setup
   3. Security vulnerability scanning options
   4. Provider and threshold selection

All steps are optional - skip anything you don't need!

💡 Configuration files supported:
   • package.json (simple projects)
   • .pastoralistrc.json
   • pastoralist.config.js
   • pastoralist.config.ts
`);
