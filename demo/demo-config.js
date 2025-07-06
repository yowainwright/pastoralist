// Shared demo configuration for pastoralist StackBlitz demos
export const demoConfig = {
  packageJson: {
    name: "pastoralist-demo",
    version: "1.0.0",
    description: "Demo of pastoralist - dependency override management tool",
    main: "index.js",
    type: "module",
    scripts: {
      start: "node index.js",
      demo: "node demo.js",
      "run-pastoralist": "pastoralist",
    },
    dependencies: {
      lodash: "^4.17.21",
      react: "^18.2.0",
      express: "^4.18.0",
    },
    devDependencies: {
      pastoralist: "^1.2.1",
    },
    overrides: {
      lodash: "4.17.20",
      react: "18.1.0",
    },
  },

  indexJs: `// Pastoralist Demo - Package Override Management
import { readFileSync } from 'fs';

console.log('🐑 Pastoralist Demo');
console.log('==================');
console.log('');

function displayPackageState(title) {
  console.log(\`\${title}\`);
  console.log('='.repeat(title.length));
  
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    
    console.log('📦 Overrides:');
    if (packageJson.overrides) {
      Object.entries(packageJson.overrides).forEach(([pkg, version]) => {
        console.log(\`   \${pkg}: \${version}\`);
      });
    } else {
      console.log('   None');
    }
    
    console.log('');
    console.log('📝 Pastoralist Appendix:');
    if (packageJson.pastoralist?.appendix) {
      Object.entries(packageJson.pastoralist.appendix).forEach(([override, info]) => {
        console.log(\`   \${override}\`);
        if (info.dependents) {
          console.log(\`     Required by: \${Object.keys(info.dependents).join(', ')}\`);
        }
      });
    } else {
      console.log('   None (pastoralist not run yet)');
    }
    
  } catch (error) {
    console.error('Error reading package.json:', error.message);
  }
  
  console.log('');
}

displayPackageState('Initial Package State');

console.log('ℹ️  What pastoralist does:');
console.log('  • Tracks why each override exists');
console.log('  • Creates an appendix showing dependent packages');
console.log('  • Automatically removes unnecessary overrides');
console.log('  • Keeps your package.json clean and documented');
console.log('');

console.log('🚀 To see pastoralist in action:');
console.log('  1. Run: npm run run-pastoralist');
console.log('  2. Check the updated package.json');
console.log('  3. See the appendix that was created');
console.log('');

console.log('💡 In a real project, add "postinstall": "pastoralist" to your scripts');
console.log('   so it runs automatically after every npm install');`,

  demoJs: `// Interactive pastoralist demo
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🐑 Pastoralist Interactive Demo');
console.log('================================');
console.log('');

function showPackageState(title) {
  console.log(\`\${title}\`);
  console.log('-'.repeat(title.length));
  
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  
  console.log('Overrides:', JSON.stringify(packageJson.overrides || {}, null, 2));
  console.log('Appendix:', JSON.stringify(packageJson.pastoralist?.appendix || {}, null, 2));
  console.log('');
}

showPackageState('BEFORE running pastoralist');

console.log('Running pastoralist...');
try {
  const output = execSync('npx pastoralist', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Pastoralist output:', output);
} catch (error) {
  console.log('Note: pastoralist execution simulated in this demo environment');
  console.log('In a real Node.js environment, it would analyze your dependencies');
  
  // Show simulated result
  console.log('');
  console.log('🔄 Simulated pastoralist result:');
  const mockResult = {
    "overrides": {
      "lodash": "4.17.20",
      "react": "18.1.0"
    },
    "pastoralist": {
      "appendix": {
        "lodash@4.17.20": {
          "dependents": {
            "express": "^4.18.0"
          }
        },
        "react@18.1.0": {
          "dependents": {
            "some-ui-lib": "^2.0.0"
          }
        }
      }
    }
  };
  
  console.log('Updated package.json would contain:');
  console.log(JSON.stringify(mockResult, null, 2));
}

console.log('');
console.log('🎉 Key benefits demonstrated:');
console.log('• Each override is now documented with its purpose');
console.log('• You can see which packages require each override');
console.log('• Teams understand dependency relationships');
console.log('• Automatic cleanup prevents unused override accumulation');`,

  readmeMd: `# 🐑 Pastoralist Demo

**Smart package.json override and resolution management**

This is a live demo of [pastoralist](https://github.com/yowainwright/pastoralist) - a tool that intelligently manages your package.json overrides and resolutions.

## What is Pastoralist?

Pastoralist automatically manages your \`package.json\` overrides and resolutions by:

- 📝 **Documenting dependencies** - Creates an appendix showing why each override exists
- 🧹 **Automatic cleanup** - Removes unnecessary overrides  
- 🔍 **Dependency tracking** - Shows which packages require each override
- 🚀 **Zero config** - Just run it or add to postinstall

## Try the Demo

Run these commands to see pastoralist in action:

\`\`\`bash
npm start           # Basic demo
npm run demo        # Interactive demo  
npm run run-pastoralist  # Run pastoralist manually
\`\`\`

## What You'll See

**Before pastoralist:**
\`\`\`json
{
  "overrides": {
    "lodash": "4.17.20",
    "react": "18.1.0"
  }
}
\`\`\`

**After pastoralist:**
\`\`\`json
{
  "overrides": {
    "lodash": "4.17.20", 
    "react": "18.1.0"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.20": {
        "dependents": {
          "express": "^4.18.0"
        }
      },
      "react@18.1.0": {
        "dependents": {
          "some-ui-lib": "^2.0.0"
        }
      }
    }
  }
}
\`\`\`

## Real-world Usage

In your actual projects, add pastoralist to your postinstall script:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  },
  "devDependencies": {
    "pastoralist": "^1.2.1"
  }
}
\`\`\`

## Why Use Pastoralist?

- **Lost track of overrides?** Pastoralist documents why each one exists
- **Outdated overrides?** It automatically removes ones that are no longer needed  
- **Security patches?** See if your overrides are still necessary after updates
- **Team clarity?** Everyone understands why overrides exist

## Learn More

- [GitHub Repository](https://github.com/yowainwright/pastoralist)
- [NPM Package](https://www.npmjs.com/package/pastoralist)
- [Documentation](https://jeffry.in/pastoralist/)

---

*Made with ❤️ by [@yowainwright](https://github.com/yowainwright)*`,

  stackblitzConfig: {
    title: "Pastoralist Demo - Smart Package Override Management",
    description:
      "Interactive demo of pastoralist - a tool that intelligently manages package.json overrides and resolutions, documenting why they exist and automatically cleaning up unnecessary ones.",
    template: "node",
    tags: [
      "pastoralist",
      "npm",
      "dependencies",
      "overrides",
      "package-management",
      "nodejs",
      "automation",
    ],
  },

  embedCode: `<iframe 
  src="https://stackblitz.com/edit/pastoralist-demo?embed=1&file=README.md&theme=dark&view=editor"
  style="width: 100%; height: 500px; border: 0; border-radius: 4px; overflow: hidden;"
  title="Pastoralist Demo"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>`,
};

// Helper function to generate demo files object
export function getDemoFiles() {
  return {
    "package.json": JSON.stringify(demoConfig.packageJson, null, 2),
    "index.js": demoConfig.indexJs,
    "demo.js": demoConfig.demoJs,
    "README.md": demoConfig.readmeMd,
  };
}

// Helper function to generate StackBlitz project config
export function getStackblitzProject() {
  return {
    files: getDemoFiles(),
    ...demoConfig.stackblitzConfig,
    dependencies: demoConfig.packageJson.dependencies,
  };
}
