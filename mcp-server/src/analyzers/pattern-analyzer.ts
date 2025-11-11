export interface PatternAnalysisResult {
  score: number;
  codeBlockCount: number;
  hasExamples: boolean;
  exampleQuality: 'none' | 'low' | 'medium' | 'high';
  issues: string[];
  suggestions: string[];
}

export class PatternAnalyzer {
  constructor(private rules: any) {}
  
  async analyze(prompt: string): Promise<PatternAnalysisResult> {
    const codeBlockCount = (prompt.match(/```/g) || []).length / 2;
    const hasExamples = codeBlockCount > 0;
    
    let exampleQuality: 'none' | 'low' | 'medium' | 'high' = 'none';
    let score = 10;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Detect if implementation is requested
    const isImplementationRequest = /implement|create|build|generate|write|add/i.test(prompt);
    
    if (isImplementationRequest && !hasExamples) {
      score -= 4;
      issues.push('Implementation request without code examples');
      suggestions.push('Show existing code patterns to match your style');
    } else if (hasExamples) {
      // Evaluate example quality
      const avgExampleLength = this.getAverageExampleLength(prompt);
      
      if (avgExampleLength < 50) {
        exampleQuality = 'low';
        score -= 1;
        suggestions.push('Examples are brief - consider more complete examples');
      } else if (avgExampleLength < 200) {
        exampleQuality = 'medium';
      } else {
        exampleQuality = 'high';
      }
      
      // Check for variety
      if (codeBlockCount > 5) {
        score -= 1;
        issues.push('Many examples may overwhelm context');
        suggestions.push('Focus on 1-3 most relevant examples');
      }
    }
    
    return {
      score: Math.max(0, score),
      codeBlockCount,
      hasExamples,
      exampleQuality,
      issues,
      suggestions,
    };
  }
  
  private getAverageExampleLength(prompt: string): number {
    const codeBlocks = prompt.match(/```[\s\S]*?```/g) || [];
    if (codeBlocks.length === 0) return 0;
    
    const totalLength = codeBlocks.reduce((sum, block) => sum + block.length, 0);
    return totalLength / codeBlocks.length;
  }
}
