import { validatePaperMarks, updatePaperTotals } from './src/lib/validatePaperMarks';

/**
 * CLI script to validate and optionally update all papers in the pastPapers.ts file
 * 
 * Run with:
 * - `bun validate-papers.ts` to check only
 * - `bun validate-papers.ts --update` to check and update totalMarks properties
 */

const shouldUpdate = process.argv.includes('--update');

// First, run validation
const result = validatePaperMarks();
console.log(`Validation ${result.valid ? 'PASSED ✅' : 'FAILED ❌'}`);

if (result.discrepancies.length > 0) {
  console.log('\nDiscrepancies found:');
  result.discrepancies.forEach(d => {
    if (d.expectedTotal === undefined) {
      console.log(`- Paper ID ${d.paperId} (${d.paperTitle}): Missing totalMarks property. Calculated total: ${d.calculatedTotal}`);
    } else {
      console.log(`- Paper ID ${d.paperId} (${d.paperTitle}): Expected ${d.expectedTotal}, calculated ${d.calculatedTotal}`);
    }
  });
  
  // Update totalMarks if requested
  if (shouldUpdate) {
    const updatedCount = updatePaperTotals();
    console.log(`\nUpdated ${updatedCount} papers with correct totalMarks values.`);
    console.log('Please review the changes and commit them if they look correct.');
  } else {
    console.log('\nTo automatically update totalMarks properties, run with: bun validate-papers.ts --update');
  }
} else {
  console.log('All papers have correct totalMarks values! 🎉');
}