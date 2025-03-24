import { pastPapers, type Paper } from './pastPapers';

/**
 * Validates that the sum of all question marks in each paper matches the expected total marks.
 * Also updates papers with missing totalMarks property.
 */
export function validatePaperMarks(): { 
  valid: boolean; 
  discrepancies: Array<{ 
    paperId: number; 
    paperTitle: string; 
    calculatedTotal: number; 
    expectedTotal?: number 
  }> 
} {
  const discrepancies: Array<{ 
    paperId: number; 
    paperTitle: string; 
    calculatedTotal: number; 
    expectedTotal?: number 
  }> = [];
  
  let allValid = true;
  
  pastPapers.forEach((paper) => {
    // Calculate the sum of marks for all questions
    const calculatedTotal = paper.questions.reduce((sum, question) => sum + question.marks, 0);
    
    // Check if totalMarks is defined and if it matches the calculated total
    if (paper.totalMarks !== undefined && paper.totalMarks !== calculatedTotal) {
      allValid = false;
      discrepancies.push({
        paperId: paper.id,
        paperTitle: `${paper.board.toUpperCase()} ${paper.subject.toUpperCase()} ${paper.year} ${paper.season} ${paper.paper}`,
        calculatedTotal,
        expectedTotal: paper.totalMarks
      });
    } else if (paper.totalMarks === undefined) {
      // If totalMarks is undefined, flag it but don't mark as invalid
      discrepancies.push({
        paperId: paper.id,
        paperTitle: `${paper.board.toUpperCase()} ${paper.subject.toUpperCase()} ${paper.year} ${paper.season} ${paper.paper}`,
        calculatedTotal,
        expectedTotal: undefined
      });
      
      // We could update the paper's totalMarks here if needed
      // (paper as Paper).totalMarks = calculatedTotal;
    }
  });
  
  return {
    valid: allValid,
    discrepancies
  };
}

/**
 * Updates all papers to ensure they have the correct totalMarks property.
 * Returns the count of papers that were updated.
 */
export function updatePaperTotals(): number {
  let updatedCount = 0;
  
  pastPapers.forEach((paper) => {
    const calculatedTotal = paper.questions.reduce((sum, question) => sum + question.marks, 0);
    
    if (paper.totalMarks === undefined || paper.totalMarks !== calculatedTotal) {
      (paper as Paper).totalMarks = calculatedTotal;
      updatedCount++;
    }
  });
  
  return updatedCount;
}

// Run the validation if this script is executed directly
if (typeof window !== 'undefined' && import.meta.url === window.location.href) {
  const result = validatePaperMarks();
  console.log(`Validation ${result.valid ? 'PASSED' : 'FAILED'}`);
  
  if (result.discrepancies.length > 0) {
    console.log('Discrepancies found:');
    result.discrepancies.forEach(d => {
      if (d.expectedTotal === undefined) {
        console.log(`- Paper ID ${d.paperId} (${d.paperTitle}): Missing totalMarks property. Calculated total: ${d.calculatedTotal}`);
      } else {
        console.log(`- Paper ID ${d.paperId} (${d.paperTitle}): Expected ${d.expectedTotal}, calculated ${d.calculatedTotal}`);
      }
    });
  }
}