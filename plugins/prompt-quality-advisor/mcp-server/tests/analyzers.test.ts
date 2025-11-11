import { TokenAnalyzer } from '../src/analyzers/token-analyzer';
import { PatternAnalyzer } from '../src/analyzers/pattern-analyzer';
import { ClarityAnalyzer } from '../src/analyzers/clarity-analyzer';
import { ContextAnalyzer } from '../src/analyzers/context-analyzer';

describe('TokenAnalyzer', () => {
  const analyzer = new TokenAnalyzer({});

  it('should detect prompt that is too short', async () => {
    const result = await analyzer.analyze('Add feature');
    
    expect(result.score).toBeLessThan(8);
    expect(result.issues.some(i => i.includes('brief'))).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should detect prompt that is too long', async () => {
    const longPrompt = 'x'.repeat(20000);
    const result = await analyzer.analyze(longPrompt);
    
    expect(result.score).toBeLessThan(9);
    expect(result.issues.some(i => i.includes('Large prompt'))).toBe(true);
  });

  it('should handle different model context limits', async () => {
    const prompt = 'x'.repeat(10000);
    
    const sonnet45 = await analyzer.analyze(prompt, [], 'claude-sonnet-4.5');
    const opus4 = await analyzer.analyze(prompt, [], 'claude-opus-4');
    
    expect(sonnet45.maxTokens).toBe(1000000);
    expect(opus4.maxTokens).toBe(200000);
    expect(sonnet45.contextWindowUsage).toBeLessThan(opus4.contextWindowUsage);
  });

  it('should account for conversation history', async () => {
    const history = [
      { role: 'user', content: 'x'.repeat(10000) },
      { role: 'assistant', content: 'y'.repeat(10000) },
    ];
    
    const result = await analyzer.analyze('New prompt', history);
    
    expect(result.historyTokens).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThan(result.currentTokens);
  });
});

describe('PatternAnalyzer', () => {
  const analyzer = new PatternAnalyzer({});

  it('should detect missing code examples in implementation request', async () => {
    const result = await analyzer.analyze('Implement a new feature for user authentication');
    
    expect(result.hasExamples).toBe(false);
    expect(result.score).toBeLessThan(7);
    expect(result.suggestions.some(s => s.includes('code patterns'))).toBe(true);
  });

  it('should recognize code examples', async () => {
    const prompt = `
      Implement authentication.
      
      Example:
      \`\`\`typescript
      async function login(email: string, password: string) {
        const user = await db.findUser(email);
        return validatePassword(password, user.hash);
      }
      \`\`\`
    `;
    
    const result = await analyzer.analyze(prompt);
    
    expect(result.hasExamples).toBe(true);
    expect(result.codeBlockCount).toBe(1);
    expect(result.exampleQuality).not.toBe('none');
  });

  it('should detect too many examples', async () => {
    const examples = Array(7).fill('```typescript\ncode\n```').join('\n\n');
    const result = await analyzer.analyze(`Task description\n\n${examples}`);
    
    expect(result.codeBlockCount).toBe(7);
    expect(result.issues.some(i => i.includes('Many examples'))).toBe(true);
  });

  it('should assess example quality', async () => {
    const shortExample = '```ts\nx\n```';
    const longExample = '```typescript\n' + 'x'.repeat(300) + '\n```';
    
    const shortResult = await analyzer.analyze(`Task\n${shortExample}`);
    const longResult = await analyzer.analyze(`Task\n${longExample}`);
    
    expect(shortResult.exampleQuality).toBe('low');
    expect(longResult.exampleQuality).toBe('high');
  });
});

describe('ClarityAnalyzer', () => {
  const analyzer = new ClarityAnalyzer({});

  it('should detect vague requests without requirements', async () => {
    const result = await analyzer.analyze('Make it better and add some features');
    
    expect(result.specificity).toBe('vague');
    expect(result.score).toBeLessThan(7);
    expect(result.hasRequirements).toBe(false);
  });

  it('should recognize explicit requirements', async () => {
    const prompt = `
      Add authentication.
      
      Requirements:
      - JWT tokens with 1 hour expiry
      - Bcrypt password hashing
      - Rate limiting on login endpoint
    `;
    
    const result = await analyzer.analyze(prompt);
    
    expect(result.hasRequirements).toBe(true);
    expect(result.specificity).not.toBe('vague');
    expect(result.score).toBeGreaterThan(7);
  });

  it('should recognize constraints', async () => {
    const prompt = `
      Requirements:
      - Add caching
      
      Constraints:
      - Must not use Redis
      - Cannot exceed 100ms latency
    `;
    
    const result = await analyzer.analyze(prompt);
    
    expect(result.hasRequirements).toBe(true);
    expect(result.hasConstraints).toBe(true);
    expect(result.specificity).toBe('specific');
  });

  it('should penalize long prompts without structure', async () => {
    const longPrompt = 'Add feature. '.repeat(200);
    const result = await analyzer.analyze(longPrompt);
    
    expect(result.score).toBeLessThan(9);
    expect(result.suggestions.some(s => s.includes('numbered requirements'))).toBe(true);
  });
});

describe('ContextAnalyzer', () => {
  const analyzer = new ContextAnalyzer({});

  it('should detect high redundancy', async () => {
    const redundant = Array(50).fill('same line repeated').join('\n');
    const result = await analyzer.analyze(redundant);
    
    expect(result.redundancyScore).toBeGreaterThan(0.3);
    expect(result.issues.some(i => i.includes('redundancy'))).toBe(true);
  });

  it('should score low redundancy well', async () => {
    const unique = Array(50).fill(0).map((_, i) => `line ${i}`).join('\n');
    const result = await analyzer.analyze(unique);
    
    expect(result.redundancyScore).toBeLessThan(0.1);
    expect(result.score).toBeGreaterThan(8);
  });

  it('should estimate relevance based on history references', async () => {
    const withRef = 'As we discussed previously, implement the feature';
    const withoutRef = 'Implement a new feature';
    
    const history = [{ role: 'user', content: 'some previous context' }];
    
    const withRefResult = await analyzer.analyze(withRef, history);
    const withoutRefResult = await analyzer.analyze(withoutRef, history);
    
    expect(withRefResult.relevanceScore).toBeGreaterThan(withoutRefResult.relevanceScore);
  });
});

describe('Integration', () => {
  it('should analyze a well-formed prompt', async () => {
    const prompt = `
      Implement user authentication with JWT tokens.
      
      Requirements:
      - 1 hour token expiry
      - Bcrypt password hashing
      - Rate limiting (5 attempts per minute)
      
      Existing pattern:
      \`\`\`typescript
      async function handleLogin(req: Request) {
        // Current auth structure
      }
      \`\`\`
    `;
    
    const tokenAnalyzer = new TokenAnalyzer({});
    const patternAnalyzer = new PatternAnalyzer({});
    const clarityAnalyzer = new ClarityAnalyzer({});
    const contextAnalyzer = new ContextAnalyzer({});
    
    const tokenResult = await tokenAnalyzer.analyze(prompt);
    const patternResult = await patternAnalyzer.analyze(prompt);
    const clarityResult = await clarityAnalyzer.analyze(prompt);
    const contextResult = await contextAnalyzer.analyze(prompt);
    
    expect(tokenResult.score).toBeGreaterThanOrEqual(7);
    expect(patternResult.score).toBeGreaterThanOrEqual(7);
    expect(clarityResult.score).toBeGreaterThanOrEqual(7);
    expect(contextResult.score).toBeGreaterThanOrEqual(7);
    
    expect(patternResult.hasExamples).toBe(true);
    expect(clarityResult.hasRequirements).toBe(true);
  });
});
