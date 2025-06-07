/**
 * Utility functions for ExamTracker application
 */

export interface UserMarks {
	[key: string]: number;
}

export interface ScoreStatistics {
	totalQuestions: number;
	answeredQuestions: number;
	totalMarks: number;
	maxMarks: number;
	percentage: number;
	grade: string;
}

export interface PaperProgress {
	paperId: string;
	paperName: string;
	subject: string;
	board: string;
	year: number;
	session: string;
	variant: string;
	totalQuestions: number;
	answeredQuestions: number;
	score: number;
	maxScore: number;
	percentage: number;
	lastUpdated: Date;
}

/**
 * Calculate statistics for a paper based on user marks
 */
export function calculatePaperStats(
	questions: Array<{ id: number; marks: number }>,
	userMarks: UserMarks,
	paperId: string
): ScoreStatistics {
	const totalQuestions = questions.length;
	const maxMarks = questions.reduce((sum, q) => sum + q.marks, 0);
	
	let totalMarks = 0;
	let answeredQuestions = 0;
	
	questions.forEach(question => {
		const key = `${paperId}-${question.id}`;
		const mark = userMarks[key] || 0;
		if (mark > 0) {
			answeredQuestions++;
		}
		totalMarks += mark;
	});
	
	const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
	const grade = calculateGrade(percentage);
	
	return {
		totalQuestions,
		answeredQuestions,
		totalMarks,
		maxMarks,
		percentage,
		grade
	};
}

/**
 * Calculate grade based on percentage
 */
export function calculateGrade(percentage: number): string {
	if (percentage >= 90) return 'A*';
	if (percentage >= 80) return 'A';
	if (percentage >= 70) return 'B';
	if (percentage >= 60) return 'C';
	if (percentage >= 50) return 'D';
	if (percentage >= 40) return 'E';
	if (percentage >= 30) return 'F';
	return 'U';
}

/**
 * Format percentage to display with appropriate decimal places
 */
export function formatPercentage(percentage: number): string {
	return percentage % 1 === 0 ? percentage.toString() : percentage.toFixed(1);
}

/**
 * Generate a unique key for storing user marks
 */
export function generateMarkKey(paperId: string, questionId: number): string {
	return `${paperId}-${questionId}`;
}

/**
 * Validate user ID format
 */
export function validateUserId(userId: string): { isValid: boolean; message?: string } {
	if (!userId || typeof userId !== 'string') {
		return { isValid: false, message: 'User ID is required' };
	}
	
	const trimmed = userId.trim();
	if (trimmed.length < 3) {
		return { isValid: false, message: 'User ID must be at least 3 characters long' };
	}
	
	if (trimmed.length > 50) {
		return { isValid: false, message: 'User ID must be less than 50 characters' };
	}
	
	// Allow alphanumeric, hyphens, underscores
	const validPattern = /^[a-zA-Z0-9_-]+$/;
	if (!validPattern.test(trimmed)) {
		return { isValid: false, message: 'User ID can only contain letters, numbers, hyphens, and underscores' };
	}
	
	return { isValid: true };
}

/**
 * Debounce function for search and other operations
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;
	
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

/**
 * Filter papers based on search query, subject, and board
 */
export function filterPapers(
	papers: Array<any>,
	searchQuery: string,
	selectedSubject: string | null,
	selectedBoard: string | null
): Array<any> {
	return papers.filter(paper => {
		const matchesSearch = !searchQuery || 
			paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
			paper.board.toLowerCase().includes(searchQuery.toLowerCase()) ||
			paper.year.toString().includes(searchQuery) ||
			paper.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
			paper.variant.toLowerCase().includes(searchQuery.toLowerCase());
		
		const matchesSubject = !selectedSubject || paper.subject === selectedSubject;
		const matchesBoard = !selectedBoard || paper.board === selectedBoard;
		
		return matchesSearch && matchesSubject && matchesBoard;
	});
}

/**
 * Group papers by subject and board
 */
export function groupPapersBySubjectAndBoard(papers: Array<any>): { [key: string]: Array<any> } {
	return papers.reduce((groups, paper) => {
		const key = `${paper.subject} - ${paper.board}`;
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(paper);
		return groups;
	}, {});
}

/**
 * Sort papers by year and session
 */
export function sortPapers(papers: Array<any>): Array<any> {
	return [...papers].sort((a, b) => {
		// Sort by year (descending)
		if (a.year !== b.year) {
			return b.year - a.year;
		}
		
		// Sort by session (Summer before Winter)
		const sessionOrder = { 'summer': 1, 'winter': 2 };
		const aSession = sessionOrder[a.session.toLowerCase() as keyof typeof sessionOrder] || 3;
		const bSession = sessionOrder[b.session.toLowerCase() as keyof typeof sessionOrder] || 3;
		
		if (aSession !== bSession) {
			return aSession - bSession;
		}
		
		// Sort by variant
		return a.variant.localeCompare(b.variant);
	});
}

/**
 * Extract unique subjects from papers
 */
export function getUniqueSubjects(papers: Array<any>): Array<{ id: string; name: string }> {
	const subjects = [...new Set(papers.map(paper => paper.subject))];
	return subjects.sort().map(subject => ({ id: subject, name: subject }));
}

/**
 * Extract unique exam boards from papers
 */
export function getUniqueExamBoards(papers: Array<any>): Array<{ id: string; name: string }> {
	const boards = [...new Set(papers.map(paper => paper.board))];
	return boards.sort().map(board => ({ id: board, name: board }));
}

/**
 * Calculate overall progress across all papers
 */
export function calculateOverallProgress(
	papers: Array<any>,
	userMarks: UserMarks
): {
	totalPapers: number;
	attemptedPapers: number;
	completedPapers: number;
	averageScore: number;
} {
	let totalPapers = papers.length;
	let attemptedPapers = 0;
	let completedPapers = 0;
	let totalScore = 0;
	let scoredPapers = 0;
	
	papers.forEach(paper => {
		const paperMarks = Object.keys(userMarks).filter(key => key.startsWith(paper.id));
		
		if (paperMarks.length > 0) {
			attemptedPapers++;
			
			// Check if all questions are answered
			const totalQuestions = paper.questions?.length || 0;
			const answeredQuestions = paperMarks.filter(key => userMarks[key] > 0).length;
			
			if (answeredQuestions === totalQuestions && totalQuestions > 0) {
				completedPapers++;
			}
			
			// Calculate score for this paper
			const paperScore = paperMarks.reduce((sum, key) => sum + (userMarks[key] || 0), 0);
			const maxScore = paper.questions?.reduce((sum: number, q: any) => sum + q.marks, 0) || 0;
			
			if (maxScore > 0) {
				totalScore += (paperScore / maxScore) * 100;
				scoredPapers++;
			}
		}
	});
	
	const averageScore = scoredPapers > 0 ? totalScore / scoredPapers : 0;
	
	return {
		totalPapers,
		attemptedPapers,
		completedPapers,
		averageScore
	};
}

/**
 * Safely parse JSON from localStorage
 */
export function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
	if (!jsonString) return fallback;
	
	try {
		return JSON.parse(jsonString);
	} catch {
		return fallback;
	}
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

/**
 * Generate a random color for charts/visualizations
 */
export function generateColor(index: number): string {
	const colors = [
		'#3B82F6', '#EF4444', '#10B981', '#F59E0B',
		'#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
		'#EC4899', '#6366F1', '#14B8A6', '#FCD34D'
	];
	return colors[index % colors.length];
}