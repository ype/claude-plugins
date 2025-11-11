# Claude Code Plugins

Claude Code plugins I use in my workflows.

## Available Plugins

### Prompt Quality Advisor

Analyzes prompt quality and provides advisory feedback for optimal Claude Code interactions.

**Features:**
- **Token Analysis**: Evaluates context window usage across different Claude models
- **Pattern Detection**: Checks for code examples and implementation patterns
- **Clarity Assessment**: Analyzes requirement specificity and vagueness
- **Context Evaluation**: Detects redundancy and relevance issues
- **Metrics Tracking**: Monitors quality trends over time

## Installation

### Add the Marketplace

First, add this marketplace to your Claude Code installation:

```bash
/plugin marketplace add ype/prompt-quality-advisor
```

Or using the full GitHub URL:

```bash
/plugin marketplace add https://github.com/ype/prompt-quality-advisor
```

### Install Plugins

Once the marketplace is added, install individual plugins:

```bash
# Install the Prompt Quality Advisor
/plugin install prompt-quality-advisor
```

**Note**: The plugin automatically builds during installation. This process compiles the TypeScript source to JavaScript and may take a few seconds.

### Verify Installation

Check that the plugin is installed and active:

```bash
/plugin list
```

## Usage

### Prompt Quality Advisor

#### Analyze a Prompt

Before submitting a complex prompt, check its quality:

```
/analyze-prompt
```

Then type your prompt and Claude will analyze it before you proceed.

**Example:**

```
User: /analyze-prompt

User: I want to add rate limiting to the API.

Claude: Quality Score: 4/10

Strengths:
- Clear intent

Improvements:
- No code examples (implementation request)
- Missing requirements (what rate limit? per-user or per-IP?)
- Context too brief (91 tokens)

Recommendations:
1. Show your existing middleware pattern
2. Specify: rate limit value, scope, and response behavior
3. Include adjacent code for integration context
```

#### View Quality Report

See your recent prompt quality metrics:

```
/prompt-report
```

**Example Output:**

```
Prompt Quality Report (Last 7 Days)

Average Score: 7.2/10 (↑ from 6.1 last week)
Total Analyses: 23

Score Distribution:
- Excellent (9-10): 5 prompts (22%)
- Good (7-8): 12 prompts (52%)
- Acceptable (5-6): 4 prompts (17%)
- Poor (0-4): 2 prompts (9%)

Common Issues:
1. Missing code examples (8 times)
2. Vague requirements (5 times)
3. Large prompts >3K tokens (3 times)

Improvement Trend: +18% week-over-week

Top Recommendations:
1. Include code examples for implementation requests
2. Add explicit "Requirements:" sections
3. Keep prompts focused under 2,500 tokens
```

## Configuration

### Customizing Plugin Settings

Each plugin can be customized. For Prompt Quality Advisor, edit `plugins/prompt-quality-advisor/config/rules.json`:

```json
{
  "token": {
    "optimalMin": 100,
    "optimalMax": 3000,
    "warningThreshold": 4000
  },
  "pattern": {
    "requireExamplesForImplementation": true,
    "maxExamples": 5,
    "minExampleLength": 50
  },
  "clarity": {
    "requireExplicitRequirements": true,
    "vaguePhrases": ["add feature", "make it better", "improve", "fix it"]
  },
  "context": {
    "maxRedundancy": 0.3,
    "minRelevance": 0.5
  }
}
```

## Development

### Building from Source

Clone the repository:

```bash
git clone https://github.com/ype/prompt-quality-advisor.git
cd prompt-quality-advisor
```

Build a specific plugin:

```bash
cd plugins/prompt-quality-advisor
task build
```

### Testing Plugins

Run tests for a plugin:

```bash
cd plugins/prompt-quality-advisor
task test
```

### Local Installation

Install a plugin locally for development:

```bash
cd plugins/prompt-quality-advisor
task install
```

Or use the Taskfile at the root:

```bash
task install  # Builds and installs all plugins
```

## Marketplace Structure

```
claude-plugins/
├── .claude-plugin/
│   └── marketplace.json         # Marketplace registry
├── plugins/
│   └── prompt-quality-advisor/  # Individual plugin
│       ├── .claude-plugin/
│       │   └── plugin.json      # Plugin metadata
│       ├── commands/            # Slash commands
│       ├── mcp-server/          # MCP server implementation
│       ├── config/              # Plugin configuration
│       └── plugin.json          # Plugin manifest
├── README.md
└── Taskfile.yml
```

## Troubleshooting

### Marketplace Not Found

If you get "Marketplace not found" error:

```bash
# Remove any old marketplace references
/plugin marketplace remove ype/prompt-quality-advisor

# Re-add the marketplace
/plugin marketplace add ype/prompt-quality-advisor
```

### Plugin Installation Fails

```bash
# Ensure the marketplace is added first
/plugin marketplace list

# If not listed, add it
/plugin marketplace add ype/prompt-quality-advisor

# Then install the plugin
/plugin install prompt-quality-advisor
```

### Plugin Not Loading

```bash
# Verify plugin is installed
/plugin list

# Reinstall if needed
/plugin uninstall prompt-quality-advisor
/plugin install prompt-quality-advisor
```

### MCP Server Not Starting (MODULE_NOT_FOUND)

If you see `Error: Cannot find module '.../mcp-server/dist/index.js'` in the logs:

**Cause**: The TypeScript source wasn't built during installation (affects versions < 1.1.0).

**Solution**: Reinstall the plugin to trigger automatic build:

```bash
/plugin uninstall prompt-quality-advisor
/plugin install prompt-quality-advisor
```

**Manual Fix** (if reinstall doesn't work):

```bash
cd ~/.claude/plugins/marketplaces/claude-plugins/plugins/prompt-quality-advisor/mcp-server
npm install
npm run build
```

**Note**: As of version 1.1.0, the plugin automatically builds during installation via the `prepare` script.

### Build Failures

For local development, ensure dependencies are installed:

```bash
cd plugins/prompt-quality-advisor/mcp-server
npm install
npm run build
```

## Contributing

### Adding New Plugins

1. Create a new directory under `plugins/`
2. Add plugin structure with `.claude-plugin/plugin.json`
3. Update `.claude-plugin/marketplace.json` to include the new plugin
4. Test locally before submitting PR

### Plugin Structure Requirements

Each plugin must have:
- `.claude-plugin/plugin.json` - Plugin metadata
- `plugin.json` - Plugin manifest (can be same as above)
- Optional: `commands/`, `agents/`, `hooks/`, `skills/`

## License

MIT

## Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review plugin-specific documentation in `plugins/<plugin-name>/`
