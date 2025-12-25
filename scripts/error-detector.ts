/**
 * Error Detector
 * Analyzes test/build output and detects error patterns
 * Based on Autonomous fix_patterns.yaml patterns
 */

import * as fs from 'fs';
import * as path from 'path';

interface FixPattern {
  id: string;
  pattern: string;
  confidence: number;
  strategy: string;
  autoFix: boolean;
  description?: string;
  suggestion?: string;
}

interface FixPatternsConfig {
  version: string;
  configuration: {
    maxFixAttempts: number;
    confidenceThreshold: number;
    backupBeforeFix: boolean;
    testAfterFix: boolean;
    rollbackOnFailure: boolean;
  };
  patterns: {
    typescript: FixPattern[];
    eslint: FixPattern[];
    e2e: FixPattern[];
    build: FixPattern[];
  };
}

interface DetectedError {
  id: string;
  category: 'typescript' | 'eslint' | 'e2e' | 'build' | 'unknown';
  pattern: FixPattern | null;
  match: string;
  confidence: number;
  autoFixable: boolean;
  suggestion: string;
  file?: string;
  line?: number;
}

class ErrorDetector {
  private patterns: FixPatternsConfig;

  constructor(patternsPath?: string) {
    const defaultPath = path.join(__dirname, 'fix-patterns.json');
    const configPath = patternsPath || defaultPath;

    if (!fs.existsSync(configPath)) {
      throw new Error(`Fix patterns config not found at: ${configPath}`);
    }

    this.patterns = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  /**
   * Detect errors from log output
   */
  detect(logOutput: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const lines = logOutput.split('\n');

    for (const line of lines) {
      const detected = this.detectLine(line);
      if (detected) {
        errors.push(detected);
      }
    }

    return errors;
  }

  /**
   * Detect error in a single line
   */
  private detectLine(line: string): DetectedError | null {
    // Try each category
    for (const category of ['typescript', 'eslint', 'e2e', 'build'] as const) {
      const patterns = this.patterns.patterns[category];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern.pattern, 'i');
        if (regex.test(line)) {
          // Extract file and line info if available
          const fileMatch = line.match(/([^:\s]+\.(?:ts|tsx|js|jsx)):(\d+)/);

          return {
            id: pattern.id,
            category,
            pattern,
            match: line.trim(),
            confidence: pattern.confidence,
            autoFixable: pattern.autoFix,
            suggestion: pattern.suggestion || pattern.description || '',
            file: fileMatch?.[1],
            line: fileMatch ? parseInt(fileMatch[2], 10) : undefined,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get summary of detected errors
   */
  summarize(errors: DetectedError[]): {
    total: number;
    byCategory: Record<string, number>;
    autoFixable: number;
    highConfidence: number;
  } {
    const byCategory: Record<string, number> = {
      typescript: 0,
      eslint: 0,
      e2e: 0,
      build: 0,
      unknown: 0,
    };

    let autoFixable = 0;
    let highConfidence = 0;

    for (const error of errors) {
      byCategory[error.category]++;
      if (error.autoFixable) autoFixable++;
      if (error.confidence >= this.patterns.configuration.confidenceThreshold) {
        highConfidence++;
      }
    }

    return {
      total: errors.length,
      byCategory,
      autoFixable,
      highConfidence,
    };
  }

  /**
   * Generate GitHub Actions output
   */
  generateActionsOutput(errors: DetectedError[]): string {
    const summary = this.summarize(errors);
    const lines: string[] = [];

    lines.push(`## Error Detection Report`);
    lines.push(``);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Errors | ${summary.total} |`);
    lines.push(`| Auto-fixable | ${summary.autoFixable} |`);
    lines.push(`| High Confidence | ${summary.highConfidence} |`);
    lines.push(``);

    if (errors.length > 0) {
      lines.push(`### Errors by Category`);
      lines.push(``);

      for (const [category, count] of Object.entries(summary.byCategory)) {
        if (count > 0) {
          lines.push(`- **${category}**: ${count}`);
        }
      }
      lines.push(``);

      lines.push(`### Error Details`);
      lines.push(``);

      for (const error of errors.slice(0, 20)) { // Limit to first 20
        const icon = error.autoFixable ? '🔧' : '⚠️';
        const confidence = Math.round(error.confidence * 100);
        lines.push(`${icon} **${error.id}** (${confidence}% confidence)`);
        if (error.file) {
          lines.push(`  - File: \`${error.file}${error.line ? `:${error.line}` : ''}\``);
        }
        lines.push(`  - ${error.suggestion}`);
        lines.push(``);
      }

      if (errors.length > 20) {
        lines.push(`... and ${errors.length - 20} more errors`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate JSON output for automation
   */
  generateJsonOutput(errors: DetectedError[]): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.summarize(errors),
      errors: errors.map(e => ({
        id: e.id,
        category: e.category,
        confidence: e.confidence,
        autoFixable: e.autoFixable,
        file: e.file,
        line: e.line,
        suggestion: e.suggestion,
      })),
    }, null, 2);
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Error Detector - Analyze test/build output for fixable errors

Usage:
  npx tsx scripts/error-detector.ts [options] < log-file.txt
  cat log-file.txt | npx tsx scripts/error-detector.ts [options]

Options:
  --json          Output as JSON
  --github        Output as GitHub Actions summary
  --patterns PATH Path to fix-patterns.json
  --help          Show this help
`);
    process.exit(0);
  }

  const patternsPath = args.includes('--patterns')
    ? args[args.indexOf('--patterns') + 1]
    : undefined;

  const detector = new ErrorDetector(patternsPath);

  // Read from stdin
  let input = '';

  if (process.stdin.isTTY) {
    // No stdin, check for file argument
    const fileArg = args.find(a => !a.startsWith('--') && fs.existsSync(a));
    if (fileArg) {
      input = fs.readFileSync(fileArg, 'utf-8');
    } else {
      console.error('Error: No input provided. Pipe log output or provide a file path.');
      process.exit(1);
    }
  } else {
    // Read from stdin
    for await (const chunk of process.stdin) {
      input += chunk;
    }
  }

  const errors = detector.detect(input);

  if (args.includes('--json')) {
    console.log(detector.generateJsonOutput(errors));
  } else if (args.includes('--github')) {
    console.log(detector.generateActionsOutput(errors));

    // Set GitHub Actions outputs
    if (process.env.GITHUB_OUTPUT) {
      const summary = detector.summarize(errors);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `total=${summary.total}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `auto-fixable=${summary.autoFixable}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `high-confidence=${summary.highConfidence}\n`);
    }
  } else {
    const summary = detector.summarize(errors);
    console.log(`Detected ${summary.total} errors:`);
    console.log(`  - Auto-fixable: ${summary.autoFixable}`);
    console.log(`  - High confidence: ${summary.highConfidence}`);
    console.log(`  - By category: ${JSON.stringify(summary.byCategory)}`);

    if (errors.length > 0) {
      console.log('\nTop errors:');
      for (const error of errors.slice(0, 5)) {
        console.log(`  [${error.id}] ${error.suggestion}`);
      }
    }
  }

  // Exit with error code if there are high-confidence issues
  const summary = detector.summarize(errors);
  process.exit(summary.highConfidence > 0 ? 1 : 0);
}

main().catch(console.error);

export { ErrorDetector, DetectedError, FixPattern };
