export interface ContextAnalysisResult {
  score: number;
  redundancyScore: number;
  relevanceScore: number;
  issues: string[];
  suggestions: string[];
}

export class ContextAnalyzer {
  constructor(private rules: any) {}
  
  async analyze(
    prompt: string,
    history?: any[]
  ): Promise<ContextAnalysisResult> {
    let score = 10;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for redundancy
    const redundancyScore = this.calculateRedundancy(prompt);
    
    if (redundancyScore > 0.3) {
      score -= 3;
      issues.push(`High redundancy detected (${(redundancyScore * 100).toFixed(0)}%)`);
      suggestions.push('Remove duplicate or very similar examples');
    }
    
    // Check relevance (basic heuristic)
    const relevanceScore = this.estimateRelevance(prompt, history);
    
    if (relevanceScore < 0.5) {
      score -= 2;
      issues.push('Context may include irrelevant information');
      suggestions.push('Focus on code/docs directly related to the task');
    }
    
    return {
      score: Math.max(0, score),
      redundancyScore,
      relevanceScore,
      issues,
      suggestions,
    };
  }
  
  private calculateRedundancy(prompt: string): number {
    const lines = prompt.split('\n').filter(l => l.trim().length > 10);
    if (lines.length < 10) return 0;
    
    const uniqueLines = new Set(lines);
    return 1 - (uniqueLines.size / lines.length);
  }
  
  private estimateRelevance(prompt: string, history?: any[]): number {
    // Simplified relevance heuristic
    // In production, could use embeddings or keyword overlap
    
    // If no history, assume relevance is high
    if (!history || history.length === 0) return 0.9;
    
    // Check if prompt references previous conversation
    const referencesHistory = /as we discussed|previously|earlier|before/i.test(prompt);
    
    return referencesHistory ? 0.8 : 0.6;
  }
}
