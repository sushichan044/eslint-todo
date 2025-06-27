#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

/**
 * Run benchmarks and save results to a file.
 */
const runBenchmarks = () => {
  console.log("🚀 Running performance benchmarks...");
  console.log("This may take a few minutes...\n");

  try {
    // Run the main benchmark
    console.log("📊 Running main select-rule benchmarks...");
    const mainResult = execSync(
      "pnpm vitest run src/operation/select-rule.bench.ts",
      {
        encoding: "utf8",
        stdio: "pipe",
      },
    );

    // Run the comparison benchmark
    console.log("📊 Running comparison benchmarks...");
    const comparisonResult = execSync(
      "pnpm vitest run src/operation/select-rule-comparison.bench.ts",
      {
        encoding: "utf8",
        stdio: "pipe",
      },
    );

    // Combine results
    const timestamp = new Date().toISOString();
    const report = `# ESLint Todo Select Rule Performance Benchmark Report

Generated on: ${timestamp}

## Environment
- Node.js: ${process.version}
- Platform: ${process.platform}
- Architecture: ${process.arch}

## Main Benchmarks
\`\`\`
${mainResult}
\`\`\`

## Algorithm Comparison (Old vs New)
\`\`\`
${comparisonResult}
\`\`\`

## Summary

### Key Changes
The new implementation introduces:
1. **Fixable Rule Prioritization**: Rules that can be auto-fixed are prioritized
2. **Multi-criteria Sorting**: [isFixable DESC, filteredCount DESC, ruleId ASC]
3. **Optimized Selection Logic**: Uses sorted array instead of multiple loops

### Performance Analysis
- Check the benchmark results above to identify any performance regressions
- Pay attention to the comparison between OLD and NEW algorithms
- Look for significant differences in execution time

### Recommendations
- If performance regression is significant (>20% slower), consider optimization
- If performance is similar or better, the change is acceptable
- Focus on real-world usage patterns rather than synthetic benchmarks
`;

    // Save report to file
    const reportPath = `benchmark-report-${Date.now()}.md`;
    writeFileSync(reportPath, report);

    console.log("✅ Benchmarks completed!");
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log("\nQuick summary:");
    console.log("- Check the generated report for detailed results");
    console.log(
      "- Look for performance differences between OLD and NEW algorithms",
    );
    console.log("- Pay attention to execution times and potential regressions");
  } catch (error) {
    console.error("❌ Benchmark execution failed:");
    console.error(error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks();
}

export { runBenchmarks };
