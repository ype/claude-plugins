import * as fs from 'fs/promises';
import * as path from 'path';

export interface Rules {
  token: {
    optimalMin: number;
    optimalMax: number;
    warningThreshold: number;
  };
  pattern: {
    requireExamplesForImplementation: boolean;
    maxExamples: number;
    minExampleLength: number;
  };
  clarity: {
    requireExplicitRequirements: boolean;
    vaguePhrases: string[];
  };
  context: {
    maxRedundancy: number;
    minRelevance: number;
  };
}

export class RulesLoader {
  private static defaultRules: Rules = {
    token: {
      optimalMin: 100,
      optimalMax: 3000,
      warningThreshold: 4000,
    },
    pattern: {
      requireExamplesForImplementation: true,
      maxExamples: 5,
      minExampleLength: 50,
    },
    clarity: {
      requireExplicitRequirements: true,
      vaguePhrases: ['add feature', 'make it better', 'improve', 'fix it'],
    },
    context: {
      maxRedundancy: 0.3,
      minRelevance: 0.5,
    },
  };

  static async load(rulesPath: string): Promise<Rules> {
    if (!rulesPath) {
      console.warn('No rules path provided, using defaults');
      return this.defaultRules;
    }

    try {
      const resolvedPath = path.resolve(rulesPath);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      const loadedRules = JSON.parse(content);
      
      // Merge with defaults to handle partial configs
      return {
        ...this.defaultRules,
        ...loadedRules,
        token: { ...this.defaultRules.token, ...loadedRules.token },
        pattern: { ...this.defaultRules.pattern, ...loadedRules.pattern },
        clarity: { ...this.defaultRules.clarity, ...loadedRules.clarity },
        context: { ...this.defaultRules.context, ...loadedRules.context },
      };
    } catch (error) {
      console.error(`Failed to load rules from ${rulesPath}:`, error);
      console.warn('Falling back to default rules');
      return this.defaultRules;
    }
  }
}
