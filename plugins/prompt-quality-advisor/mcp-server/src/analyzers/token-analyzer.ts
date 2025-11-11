export interface TokenAnalysisResult {
  score: number;
  totalTokens: number;
  historyTokens: number;
  currentTokens: number;
  contextWindowUsage: number;
  maxTokens: number;
  modelId: string;
  issues: string[];
  suggestions: string[];
}

export class TokenAnalyzer {
  private readonly modelContextLimits: Record<string, number> = {
    'claude-opus-4': 200000,
    'claude-sonnet-4.5': 1000000,
    'claude-sonnet-4': 200000,
    'claude-haiku-4': 200000,
  };
  
  private readonly defaultContextLimit = 200000;
  private readonly optimalMin = 100;
  private readonly optimalMax = 3000;
  
  constructor(private rules: any) {}
  
  async analyze(
    prompt: string,
    history?: any[],
    modelId?: string
  ): Promise<TokenAnalysisResult> {
    const maxTokens = this.getModelContextLimit(modelId);
    const currentTokens = this.estimateTokens(prompt);
    const historyTokens = history 
      ? history.reduce((sum, msg) => sum + this.estimateTokens(JSON.stringify(msg)), 0)
      : 0;
    
    const totalTokens = currentTokens + historyTokens;
    const contextWindowUsage = (totalTokens / maxTokens) * 100;
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 10;
    
    // Token count checks
    if (currentTokens < this.optimalMin) {
      score -= 3;
      issues.push(`Very brief prompt (${currentTokens} tokens)`);
      suggestions.push('Add relevant code examples or context');
    } else if (currentTokens > this.optimalMax) {
      score -= 2;
      issues.push(`Large prompt (${currentTokens} tokens)`);
      suggestions.push('Consider splitting into focused chunks');
    }
    
    // Context window checks
    if (contextWindowUsage > 75) {
      score -= 2;
      issues.push(`High context window usage (${contextWindowUsage.toFixed(1)}%)`);
      suggestions.push('Consider /clear to reset conversation');
    } else if (contextWindowUsage > 90) {
      score -= 3;
      issues.push(`Very high context window usage (${contextWindowUsage.toFixed(1)}%)`);
      suggestions.push('Context window nearly full - reset conversation');
    }
    
    return {
      score: Math.max(0, score),
      totalTokens,
      historyTokens,
      currentTokens,
      contextWindowUsage,
      maxTokens,
      modelId: modelId || 'unknown',
      issues,
      suggestions,
    };
  }
  
  private getModelContextLimit(modelId?: string): number {
    if (!modelId) return this.defaultContextLimit;
    return this.modelContextLimits[modelId] || this.defaultContextLimit;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}
