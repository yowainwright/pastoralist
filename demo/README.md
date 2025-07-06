# Pastoralist Demo Tools

This folder contains tools to create interactive StackBlitz demos for pastoralist.

## Files

- **`demo-config.js`** - Shared configuration for all demo files and settings
- **`create-demo.js`** - Command-line tool to generate demos and embed codes
- **`create-demo.html`** - Browser-based demo creator with GUI

## Usage

### Command Line

```bash
# Generate complete demo with files and URLs
pnpm run create-demo

# Generate just embed codes
pnpm run demo-embed

# Show all available commands
node demo/create-demo.js help

# Show demo file contents
node demo/create-demo.js files
```

### Browser GUI

Open `create-demo.html` in your browser for a graphical interface to:

- Create StackBlitz demos instantly
- Get embed codes for documentation
- Copy URLs for sharing

## What Gets Created

The demo creates a complete Node.js project showcasing pastoralist:

- **Sample package.json** with lodash and react overrides
- **Interactive scripts** demonstrating pastoralist functionality
- **Before/after examples** showing appendix creation
- **Complete documentation** explaining how pastoralist works

## Outputs

- **Quick Create URL** - Instant StackBlitz project creation
- **Embed codes** - HTML and Markdown for websites/docs
- **Demo files** - For manual upload to any platform
- **Direct links** - Ready-to-share URLs

## Example URLs

- **Demo**: https://stackblitz.com/edit/pastoralist-demo
- **Quick Create**: Generates custom URLs with pre-configured dependencies
- **Embed Code**: Ready-to-use iframe for documentation

Perfect for sharing pastoralist functionality with teams, in documentation, or for demonstrations!
