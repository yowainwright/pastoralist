#!/usr/bin/env bun

console.log('🔒 Pastoralist Security Demo\n');
console.log('='.repeat(60));

console.log(`
This demo showcases Pastoralist's security features:
- Vulnerability detection in dependencies
- Automatic security patches via overrides
- Interactive mode for selective fixes
- Multiple security providers (OSV, GitHub, etc.)

📦 Current vulnerable dependencies:
   - lodash@4.17.20 (CVE-2021-23337)
   - minimist@1.2.5 (CVE-2021-44906)
   - axios@0.21.0 (CVE-2021-3749)
   - express@4.17.1 (transitive vulnerabilities)
   - moment@2.29.1 (CVE-2022-31129)

🚀 Commands to try:
   bun start         - Show this message
   bun run check     - Check for vulnerabilities
   bun run fix       - Auto-fix all vulnerabilities
   bun run interactive - Choose which fixes to apply

💡 Try different modes to see how pastoralist handles security!
`);