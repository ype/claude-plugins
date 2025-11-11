export interface ClarityAnalysisResult {
  score: number;
  hasRequirements: boolean;
  hasConstraints: boolean;
  specificity: 'vague' | 'moderate' | 'specific';
  issues: string[];
  suggestions: string[];
}

export class ClarityAnalyzer {
  private readonly vaguePhrases = [
    'add feature',
    'make it better',
    'improve',
    'fix it',
    'update',
  ];
  
  private readonly requirementMarkers = [
    'requirements:',
    'needs to:',
    'must:',
    'should:',
    'requirements are:',
  ];
  
  private readonly constraintMarkers = [
    'constraints:',
    'limitations:',
    'must not:',
    'cannot:',
    'avoid:',
  ];
  
  constructor(private rules: any) {}
  
  async analyze(prompt: string, taskContext?: string): Promise<ClarityAnalysisResult> {
    const lowerPrompt = prompt.toLowerCase();
    
    const hasRequirements = this.requirementMarkers.some(marker => 
      lowerPrompt.includes(marker)
    );
    
    const hasConstraints = this.constraintMarkers.some(marker =>
      lowerPrompt.includes(marker)
    );
    
    // Detect vague phrases
    const vagueCount = this.vaguePhrases.filter(phrase =>
      lowerPrompt.includes(phrase)
    ).length;
    
    let specificity: 'vague' | 'moderate' | 'specific' = 'moderate';
    let score = 10;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Vagueness check
    if (vagueCount > 0 && !hasRequirements) {
      specificity = 'vague';
      score -= 4;
      issues.push('Vague request without explicit requirements');
      suggestions.push('Add a "Requirements:" section with specific details');
    } else if (hasRequirements && hasConstraints) {
      specificity = 'specific';
    }
    
    // Requirements check for longer prompts
    if (prompt.length > 1000 && !hasRequirements) {
      score -= 2;
      issues.push('Long prompt without structured requirements');
      suggestions.push('Break down into numbered requirements');
    }
    
    // Check for examples alongside vague requests
    if (vagueCount > 0 && prompt.includes('```')) {
      score += 2; // Partially offset vagueness penalty
      specificity = 'moderate';
    }
    
    return {
      score: Math.max(0, score),
      hasRequirements,
      hasConstraints,
      specificity,
      issues,
      suggestions,
    };
  }
}
