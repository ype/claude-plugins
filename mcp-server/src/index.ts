import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TokenAnalyzer } from './analyzers/token-analyzer.js';
import { PatternAnalyzer } from './analyzers/pattern-analyzer.js';
import { ClarityAnalyzer } from './analyzers/clarity-analyzer.js';
import { ContextAnalyzer } from './analyzers/context-analyzer.js';
import { RulesLoader } from './rules/loader.js';
import { MetricsTracker } from './storage/metrics.js';

const server = new Server(
  {
    name: 'prompt-advisor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Load configuration
const rules = await RulesLoader.load(process.env.RULES_PATH || '');
const metrics = new MetricsTracker(process.env.METRICS_PATH || '');

// Initialize analyzers
const tokenAnalyzer = new TokenAnalyzer(rules.token);
const patternAnalyzer = new PatternAnalyzer(rules.pattern);
const clarityAnalyzer = new ClarityAnalyzer(rules.clarity);
const contextAnalyzer = new ContextAnalyzer(rules.context);

// Tool: Analyze prompt quality
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'prompt_advisor_analyze',
      description: 'Analyzes a prompt for quality and provides advisory feedback',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt text to analyze',
          },
          conversationHistory: {
            type: 'array',
            description: 'Previous conversation messages',
          },
          taskContext: {
            type: 'string',
            description: 'What the user is trying to accomplish',
          },
          modelId: {
            type: 'string',
            description: 'The Claude model being used (e.g., claude-sonnet-4.5)',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'prompt_advisor_report',
      description: 'Generates a report of recent prompt quality metrics',
      inputSchema: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to include in report',
            default: 7,
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'prompt_advisor_analyze') {
    const { prompt, conversationHistory, taskContext, modelId } = request.params.arguments as {
      prompt: string;
      conversationHistory?: any[];
      taskContext?: string;
      modelId?: string;
    };

    // Run all analyzers
    const tokenAnalysis = await tokenAnalyzer.analyze(prompt, conversationHistory, modelId);
    const patternAnalysis = await patternAnalyzer.analyze(prompt);
    const clarityAnalysis = await clarityAnalyzer.analyze(prompt, taskContext);
    const contextAnalysis = await contextAnalyzer.analyze(prompt, conversationHistory);

    // Aggregate results
    const analysis = {
      overallScore: calculateScore({
        token: tokenAnalysis,
        pattern: patternAnalysis,
        clarity: clarityAnalysis,
        context: contextAnalysis,
      }),
      tokenAnalysis,
      patternAnalysis,
      clarityAnalysis,
      contextAnalysis,
      recommendations: generateRecommendations({
        token: tokenAnalysis,
        pattern: patternAnalysis,
        clarity: clarityAnalysis,
        context: contextAnalysis,
      }),
      timestamp: new Date().toISOString(),
    };

    // Track metrics (async, don't block)
    metrics.record(analysis).catch(console.error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  if (request.params.name === 'prompt_advisor_report') {
    const { days } = request.params.arguments as { days: number };
    
    const report = await metrics.generateReport(days || 7);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Helper functions
function calculateScore(analyses: any): number {
  const weights = { token: 0.3, pattern: 0.25, clarity: 0.25, context: 0.2 };
  return Math.round(
    analyses.token.score * weights.token +
    analyses.pattern.score * weights.pattern +
    analyses.clarity.score * weights.clarity +
    analyses.context.score * weights.context
  );
}

function generateRecommendations(analyses: any): string[] {
  const recommendations: string[] = [];
  
  if (analyses.token.score < 7) {
    recommendations.push(...analyses.token.suggestions);
  }
  if (analyses.pattern.score < 7) {
    recommendations.push(...analyses.pattern.suggestions);
  }
  if (analyses.clarity.score < 7) {
    recommendations.push(...analyses.clarity.suggestions);
  }
  if (analyses.context.score < 7) {
    recommendations.push(...analyses.context.suggestions);
  }
  
  return recommendations;
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
