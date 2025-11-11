import * as fs from 'fs/promises';
import * as path from 'path';

export interface MetricEntry {
  timestamp: string;
  overallScore: number;
  tokenScore: number;
  patternScore: number;
  clarityScore: number;
  contextScore: number;
  recommendations: string[];
}

export interface MetricsReport {
  periodStart: string;
  periodEnd: string;
  totalAnalyses: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 9-10
    good: number;      // 7-8
    acceptable: number; // 5-6
    poor: number;      // 0-4
  };
  commonIssues: Array<{ issue: string; count: number }>;
  improvementTrend: number; // Percentage change from previous period
  topRecommendations: string[];
}

export class MetricsTracker {
  private metricsPath: string;

  constructor(metricsPath: string) {
    this.metricsPath = metricsPath || `${process.env.HOME}/.claude/prompt-metrics.jsonl`;
  }

  async record(analysis: any): Promise<void> {
    const entry: MetricEntry = {
      timestamp: analysis.timestamp,
      overallScore: analysis.overallScore,
      tokenScore: analysis.tokenAnalysis.score,
      patternScore: analysis.patternAnalysis.score,
      clarityScore: analysis.clarityAnalysis.score,
      contextScore: analysis.contextAnalysis.score,
      recommendations: analysis.recommendations,
    };

    try {
      // Ensure directory exists
      const dir = path.dirname(this.metricsPath);
      await fs.mkdir(dir, { recursive: true });

      // Append to JSONL file
      await fs.appendFile(this.metricsPath, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (error) {
      console.error('Failed to record metrics:', error);
    }
  }

  async generateReport(days: number): Promise<MetricsReport> {
    try {
      const content = await fs.readFile(this.metricsPath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l);
      const entries: MetricEntry[] = lines.map(line => JSON.parse(line));

      // Filter by date range
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const filtered = entries.filter(e => new Date(e.timestamp) >= startDate);

      if (filtered.length === 0) {
        return this.emptyReport(startDate.toISOString(), now.toISOString());
      }

      // Calculate metrics
      const totalAnalyses = filtered.length;
      const averageScore = filtered.reduce((sum, e) => sum + e.overallScore, 0) / totalAnalyses;

      // Score distribution
      const distribution = {
        excellent: filtered.filter(e => e.overallScore >= 9).length,
        good: filtered.filter(e => e.overallScore >= 7 && e.overallScore < 9).length,
        acceptable: filtered.filter(e => e.overallScore >= 5 && e.overallScore < 7).length,
        poor: filtered.filter(e => e.overallScore < 5).length,
      };

      // Common issues (from recommendations)
      const issueMap = new Map<string, number>();
      filtered.forEach(e => {
        e.recommendations.forEach(rec => {
          issueMap.set(rec, (issueMap.get(rec) || 0) + 1);
        });
      });
      const commonIssues = Array.from(issueMap.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Improvement trend (compare first half to second half)
      const midpoint = Math.floor(filtered.length / 2);
      const firstHalf = filtered.slice(0, midpoint);
      const secondHalf = filtered.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.overallScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.overallScore, 0) / secondHalf.length;
      const improvementTrend = ((secondAvg - firstAvg) / firstAvg) * 100;

      // Top recommendations (most frequent)
      const topRecommendations = commonIssues.slice(0, 3).map(i => i.issue);

      return {
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString(),
        totalAnalyses,
        averageScore: Math.round(averageScore * 10) / 10,
        scoreDistribution: distribution,
        commonIssues,
        improvementTrend: Math.round(improvementTrend * 10) / 10,
        topRecommendations,
      };
    } catch (error) {
      console.error('Failed to generate report:', error);
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return this.emptyReport(startDate.toISOString(), now.toISOString());
    }
  }

  private emptyReport(start: string, end: string): MetricsReport {
    return {
      periodStart: start,
      periodEnd: end,
      totalAnalyses: 0,
      averageScore: 0,
      scoreDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
      commonIssues: [],
      improvementTrend: 0,
      topRecommendations: [],
    };
  }
}
