#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🏗️  Pastoralist Workspaces Demo\n');
console.log('='.repeat(60));

console.log(`
This demo shows how pastoralist works in monorepos:
- Managing overrides at the root level
- Tracking dependencies across workspace packages
- Applying security fixes to all workspaces
- Cleaning up unused overrides across the monorepo

📦 Monorepo Structure:
   root/
   ├── package.json (with overrides)
   └── packages/
       ├── app/     (React app)
       └── shared/  (Shared utilities)

🎯 Current overrides apply to:
   - All workspace packages
   - Root dependencies
   - Transitive dependencies
`);

// Show workspace packages
const workspaces = ['packages/app', 'packages/shared'];

console.log('📋 Workspace Packages:\n');
workspaces.forEach(ws => {
  const pkgPath = resolve(ws, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    console.log(`   ${pkg.name}`);
    if (pkg.dependencies) {
      Object.entries(pkg.dependencies).forEach(([dep, version]) => {
        console.log(`     - ${dep}@${version}`);
      });
    }
  }
});

// Show root overrides
const rootPkg = JSON.parse(readFileSync('./package.json', 'utf8'));
console.log('\n📝 Root Overrides:');
if (rootPkg.overrides) {
  Object.entries(rootPkg.overrides).forEach(([pkg, version]) => {
    console.log(`   ${pkg}: ${version}`);
  });
}

console.log(`
🚀 Commands to try:
   bun start         - Show this demo
   bun run check     - Check root only
   bun run fix       - Fix root overrides
   bun run fix-workspaces - Fix including all workspaces

💡 Benefits in monorepos:
   - Single source of truth for overrides
   - Consistent versions across packages
   - Easier security management
   - Reduced duplication
`);