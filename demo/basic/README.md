# Pastoralist Basic Demo

This demo shows the core functionality of pastoralist - managing package overrides with automatic documentation.

## What This Demo Shows

- How pastoralist tracks package overrides
- Automatic creation of an appendix documenting why overrides exist
- Which packages depend on each override
- Automatic cleanup of unused overrides

## Try It Live

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/yowainwright/pastoralist/tree/main/demo/basic)

## Run Locally

```bash
# Clone the repo
git clone https://github.com/yowainwright/pastoralist.git
cd pastoralist/demo/basic

# Install dependencies
bun install

# Run the demo
bun start

# Check what pastoralist would do
bun run check

# Apply pastoralist fixes
bun run fix
```

## What's Happening

1. **Initial State**: The package.json has overrides for `lodash` and `react`
2. **Run Pastoralist**: Execute `bun run fix`
3. **Result**: Pastoralist adds an appendix showing:
   - Which packages require each override
   - Why the override exists
   - Removes any unnecessary overrides

## Example Output

Before pastoralist:
```json
{
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  }
}
```

After pastoralist:
```json
{
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "express": "4.17.1"
        }
      },
      "react@18.2.0": {
        "dependents": {
          "some-component": "1.0.0"
        }
      }
    }
  }
}
```