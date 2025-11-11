# Prompt Quality Advisor

Advisory tool that analyzes prompt quality and provides feedback for optimal Claude Code interactions.

## Features

- **Token Analysis**: Evaluates context window usage across different Claude models
- **Pattern Detection**: Checks for code examples and implementation patterns
- **Clarity Assessment**: Analyzes requirement specificity and vagueness
- **Context Evaluation**: Detects redundancy and relevance issues
- **Metrics Tracking**: Monitors quality trends over time

## Installation

### Method 1: From GitHub Repository (Recommended)

Install directly from the GitHub repository:

```bash
/plugin add ype/prompt-quality-advisor
```

This single command will:
- Fetch the plugin from GitHub
- Build the MCP server
- Install and activate the plugin

**Note**: Do not use `/plugin marketplace add` for individual plugins. That command is for adding collections of multiple plugins, not single plugin repositories.

### Method 2: Local Development

For development or customization:

```bash
# Clone the repository
git clone https://github.com/ype/prompt-quality-advisor.git
cd prompt-quality-advisor

# Build and install locally
task build
task install
```

Or install directly from the local directory:

```bash
# From within the plugin directory
/plugin install .
```

### Verification

After installation, verify the plugin is active:

```bash
/plugin list
```

You should see `prompt-quality-advisor` in the list of installed plugins.

## Usage

### Analyze a Prompt

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

### View Quality Report

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

### Customizing Rules

Edit `config/rules.json` to adjust team-specific thresholds:

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

### Model Context Limits

The plugin automatically adjusts thresholds based on the Claude model:

- `claude-sonnet-4.5`: 1M tokens
- `claude-opus-4`: 200K tokens
- `claude-sonnet-4`: 200K tokens
- `claude-haiku-4`: 200K tokens

## Development

### Build

```bash
task build
```

### Test

```bash
task test
```

### Watch Mode

```bash
task dev
```

### Validate

```bash
task validate
```

## Architecture

```
prompt-quality-advisor/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata (required for installation)
├── commands/
│   ├── analyze-prompt.md        # /analyze-prompt command
│   └── prompt-report.md         # /prompt-report command
├── mcp-server/
│   ├── src/
│   │   ├── index.ts             # MCP server entry
│   │   ├── analyzers/           # Analysis modules
│   │   ├── rules/               # Configuration loading
│   │   └── storage/             # Metrics tracking
│   └── dist/                    # Compiled output
├── config/
│   ├── rules.json               # Team rules
│   └── thresholds.json          # Quality thresholds
├── plugin.json                  # Plugin manifest (also at root)
└── Taskfile.yml                 # Build tasks
```

## How It Works

1. **Analysis**: When you run `/analyze-prompt`, the plugin examines your prompt across four dimensions:
   - Token count and context window usage
   - Code example presence and quality
   - Requirement clarity and specificity
   - Context relevance and redundancy

2. **Scoring**: Each analyzer assigns a score (0-10) based on configured rules

3. **Aggregation**: Overall score is calculated using weighted average:
   - Token: 30%
   - Pattern: 25%
   - Clarity: 25%
   - Context: 20%

4. **Recommendations**: Actionable suggestions are generated based on detected issues

5. **Tracking**: Metrics are stored in `~/.claude/prompt-metrics.jsonl` for trend analysis

## Metrics Storage

Metrics are stored in JSONL format at `~/.claude/prompt-metrics.jsonl`:

```jsonl
{"timestamp":"2025-11-09T10:30:00Z","overallScore":8,"tokenScore":9,"patternScore":8,"clarityScore":7,"contextScore":8,"recommendations":["Add explicit requirements"]}
{"timestamp":"2025-11-09T14:15:00Z","overallScore":6,"tokenScore":7,"patternScore":4,"clarityScore":6,"contextScore":8,"recommendations":["Show code examples","Specify requirements"]}
```

## Troubleshooting

### Plugin Installation Issues

If installation fails, try these steps:

```bash
# Uninstall any previous version
/plugin uninstall prompt-quality-advisor

# Reinstall from GitHub
/plugin add ype/prompt-quality-advisor
```

If installing from a local clone:

```bash
# Ensure you have the latest version
cd prompt-quality-advisor
git pull origin main

# Build and install
task build
task install
```

### Plugin not loading

```bash
# Verify plugin is installed
/plugin list

# Reinstall if needed
task reinstall
```

Or from Claude Code:

```bash
/plugin uninstall prompt-quality-advisor
/plugin add ype/prompt-quality-advisor
```

### MCP server not starting

```bash
# Check logs
tail -f ~/.claude/logs/prompt-advisor.log

# Rebuild server
task clean
task build
```

### Commands not appearing

```bash
# Validate plugin structure
task validate

# Check commands directory
ls -la commands/
```

## Contributing

### Adding New Analyzers

1. Create analyzer in `mcp-server/src/analyzers/`
2. Implement the analyzer interface
3. Register in `mcp-server/src/index.ts`
4. Add configuration in `config/rules.json`
5. Write tests

### Customizing for Your Stack

Add stack-specific rules in `config/rules.json`:

```json
{
  "clarity": {
    "vaguePhrases": [
      "add feature",
      "make it better",
      "fix the kubernetes issue",
      "update the terraform"
    ]
  }
}
```

## License

MIT
