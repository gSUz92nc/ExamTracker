/**
 * Sample data generator for testing and development
 */

import type { Paper, Question } from './pastPapers';
import type { UserMarks } from './utils';

export interface SampleDataConfig {
	paperCount?: number;
	questionsPerPaper?: number;
	subjects?: string[];
	boards?: string[];
	years?: number[];
	sessions?: string[];
	variants?: string[];
	includeUserMarks?: boolean;
	completionRate?: number; // 0-1, percentage of papers with marks
	averageScore?: number; // 0-100, average score percentage
}

const DEFAULT_SUBJECTS = [
	'Mathematics',
	'Physics',
	'Chemistry',
	'Biology',
	'Computer Science',
	'English Literature',
	'History',
	'Geography',
	'Economics',
	'Psychology'
];

const DEFAULT_BOARDS = [
	'AQA',
	'Edexcel',
	'OCR',
	'WJEC',
	'CIE',
	'IGCSE'
];

const DEFAULT_SESSIONS = ['Summer', 'Winter'];
const DEFAULT_VARIANTS = ['A', 'B', 'C', '1', '2', '3'];

export class SampleDataGenerator {
	private config: Required<SampleDataConfig>;
	private paperIdCounter: number = 1;

	constructor(config: SampleDataConfig = {}) {
		this.config = {
			paperCount: 50,
			questionsPerPaper: 8,
			subjects: DEFAULT_SUBJECTS,
			boards: DEFAULT_BOARDS,
			years: [2020, 2021, 2022, 2023, 2024],
			sessions: DEFAULT_SESSIONS,
			variants: DEFAULT_VARIANTS,
			includeUserMarks: true,
			completionRate: 0.7,
			averageScore: 75,
			...config
		};
	}

	/**
	 * Generate sample papers
	 */
	generatePapers(): Paper[] {
		const papers: Paper[] = [];

		for (let i = 0; i < this.config.paperCount; i++) {
			const paper = this.generateSinglePaper();
			papers.push(paper);
		}

		return papers.sort((a, b) => {
			// Sort by year desc, then session, then subject
			if (a.year !== b.year) return b.year - a.year;
			if (a.session !== b.session) return a.session.localeCompare(b.session);
			return a.subject.localeCompare(b.subject);
		});
	}

	/**
	 * Generate user marks for given papers
	 */
	generateUserMarks(papers: Paper[]): UserMarks {
		const userMarks: UserMarks = {};

		if (!this.config.includeUserMarks) {
			return userMarks;
		}

		papers.forEach(paper => {
			const shouldHaveMarks = Math.random() < this.config.completionRate;
			if (!shouldHaveMarks) return;

			const questions = paper.questions || [];
			const isCompleted = Math.random() < 0.8; // 80% of attempted papers are completed

			questions.forEach((question, index) => {
				// Skip some questions if not completed
				if (!isCompleted && Math.random() < 0.3) return;

				const maxMarks = question.marks;
				const targetPercentage = this.generateScorePercentage();
				const score = Math.round((targetPercentage / 100) * maxMarks);
				const clampedScore = Math.max(0, Math.min(score, maxMarks));

				const key = `${paper.id}-${question.id}`;
				userMarks[key] = clampedScore;
			});
		});

		return userMarks;
	}

	/**
	 * Generate complete sample dataset
	 */
	generateCompleteDataset(): { papers: Paper[]; userMarks: UserMarks } {
		const papers = this.generatePapers();
		const userMarks = this.generateUserMarks(papers);

		return { papers, userMarks };
	}

	/**
	 * Generate papers for specific subject
	 */
	generateSubjectPapers(subject: string, count: number = 10): Paper[] {
		const originalConfig = { ...this.config };
		this.config.subjects = [subject];
		this.config.paperCount = count;

		const papers = this.generatePapers();

		// Restore original config
		this.config = originalConfig;

		return papers;
	}

	/**
	 * Generate performance test data with specific characteristics
	 */
	generatePerformanceTestData(scenarios: {
		highPerformer?: boolean;
		lowPerformer?: boolean;
		inconsistent?: boolean;
		improving?: boolean;
		declining?: boolean;
	} = {}): { papers: Paper[]; userMarks: UserMarks } {
		const papers = this.generatePapers();
		const userMarks: UserMarks = {};

		papers.forEach((paper, paperIndex) => {
			const questions = paper.questions || [];
			let baseScore = this.config.averageScore;

			// Apply scenario modifications
			if (scenarios.highPerformer) {
				baseScore = 90 + Math.random() * 10;
			} else if (scenarios.lowPerformer) {
				baseScore = 20 + Math.random() * 30;
			} else if (scenarios.improving) {
				baseScore = 40 + (paperIndex / papers.length) * 50;
			} else if (scenarios.declining) {
				baseScore = 90 - (paperIndex / papers.length) * 50;
			} else if (scenarios.inconsistent) {
				baseScore = 50 + (Math.random() - 0.5) * 60;
			}

			questions.forEach(question => {
				const variation = (Math.random() - 0.5) * 20; // ±10% variation
				const scorePercentage = Math.max(0, Math.min(100, baseScore + variation));
				const score = Math.round((scorePercentage / 100) * question.marks);

				const key = `${paper.id}-${question.id}`;
				userMarks[key] = score;
			});
		});

		return { papers, userMarks };
	}

	/**
	 * Generate realistic exam questions
	 */
	private generateQuestions(subject: string): Question[] {
		const questions: Question[] = [];
		const questionCount = this.config.questionsPerPaper;

		for (let i = 1; i <= questionCount; i++) {
			const marks = this.generateQuestionMarks(subject, i);
			questions.push({
				id: i,
				marks
			});
		}

		return questions;
	}

	/**
	 * Generate realistic mark allocations based on subject and question number
	 */
	private generateQuestionMarks(subject: string, questionNumber: number): number {
		// Different subjects have different marking patterns
		const patterns = {
			'Mathematics': [6, 8, 10, 12, 15, 18, 20, 25],
			'Physics': [4, 6, 8, 10, 12, 15, 18, 20],
			'Chemistry': [4, 6, 8, 10, 12, 14, 16, 20],
			'Biology': [3, 5, 7, 9, 12, 15, 18, 22],
			'Computer Science': [5, 8, 10, 12, 15, 18, 20, 25],
			'English Literature': [10, 15, 20, 25, 30, 35, 40, 50],
			'History': [8, 12, 16, 20, 25, 30, 35, 40],
			'Geography': [6, 10, 15, 20, 25, 30, 35, 40],
			'Economics': [8, 12, 16, 20, 25, 30, 35, 45],
			'Psychology': [6, 10, 15, 20, 25, 30, 35, 40]
		};

		const subjectPattern = patterns[subject as keyof typeof patterns] || patterns['Mathematics'];
		const maxIndex = Math.min(questionNumber - 1, subjectPattern.length - 1);
		
		// Add some variation
		const baseMarks = subjectPattern[maxIndex];
		const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
		return Math.max(1, baseMarks + variation);
	}

	/**
	 * Generate a single paper
	 */
	private generateSinglePaper(): Paper {
		const subject = this.randomChoice(this.config.subjects);
		const board = this.randomChoice(this.config.boards);
		const year = this.randomChoice(this.config.years);
		const session = this.randomChoice(this.config.sessions);
		const variant = this.randomChoice(this.config.variants);

		const id = `${subject.toLowerCase().replace(/\s+/g, '-')}-${board.toLowerCase()}-${year}-${session.toLowerCase()}-${variant.toLowerCase()}-${this.paperIdCounter++}`;
		
		const questions = this.generateQuestions(subject);

		return {
			id,
			subject,
			board,
			year,
			session,
			variant,
			paperUrl: `https://example.com/papers/${id}.pdf`,
			markschemeUrl: `https://example.com/markschemes/${id}-ms.pdf`,
			questions
		};
	}

	/**
	 * Generate score percentage based on normal distribution around average
	 */
	private generateScorePercentage(): number {
		// Use Box-Muller transform for normal distribution
		const u1 = Math.random();
		const u2 = Math.random();
		const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		
		// Scale to desired mean and standard deviation
		const mean = this.config.averageScore;
		const stdDev = 15; // Standard deviation of 15%
		
		const score = mean + (z0 * stdDev);
		
		// Clamp to 0-100 range
		return Math.max(0, Math.min(100, score));
	}

	/**
	 * Helper method to randomly choose from array
	 */
	private randomChoice<T>(array: T[]): T {
		return array[Math.floor(Math.random() * array.length)];
	}

	/**
	 * Generate time-series data for progress tracking
	 */
	generateProgressData(days: number = 30): Array<{
		date: string;
		score: number;
		paperId: string;
		subject: string;
	}> {
		const progressData: Array<{
			date: string;
			score: number;
			paperId: string;
			subject: string;
		}> = [];

		const subjects = this.config.subjects.slice(0, 3); // Use first 3 subjects
		let baseScore = 60; // Starting score

		for (let i = 0; i < days; i++) {
			// Simulate improvement over time with some randomness
			const improvementRate = 0.5; // 0.5% improvement per day on average
			const randomVariation = (Math.random() - 0.5) * 10; // ±5% random variation
			
			baseScore += improvementRate + randomVariation;
			baseScore = Math.max(0, Math.min(100, baseScore)); // Clamp to 0-100

			const date = new Date();
			date.setDate(date.getDate() - (days - i));

			const subject = this.randomChoice(subjects);
			const paperId = `progress-${subject.toLowerCase()}-${i}`;

			progressData.push({
				date: date.toISOString().split('T')[0],
				score: Math.round(baseScore * 100) / 100,
				paperId,
				subject
			});
		}

		return progressData;
	}

	/**
	 * Export sample data to files in temp directory
	 */
	exportToTempFiles(): {
		papersFile: string;
		userMarksFile: string;
		progressFile: string;
	} {
		const { papers, userMarks } = this.generateCompleteDataset();
		const progressData = this.generateProgressData();
		
		const timestamp = new Date().toISOString().split('T')[0];
		
		const exports = {
			papersFile: `temp/test-data/sample-papers-${timestamp}.json`,
			userMarksFile: `temp/test-data/sample-marks-${timestamp}.json`,
			progressFile: `temp/test-data/sample-progress-${timestamp}.json`
		};

		// Note: In a real implementation, you would write these files
		// For now, we'll just return the file paths
		console.log('Sample data generated:', {
			papers: papers.length,
			userMarks: Object.keys(userMarks).length,
			progress: progressData.length
		});

		return exports;
	}

	/**
	 * Generate edge case test data
	 */
	generateEdgeCases(): {
		emptyPapers: Paper[];
		noPapers: Paper[];
		singleQuestion: Paper[];
		maxMarks: Paper[];
		perfectScores: UserMarks;
		zeroScores: UserMarks;
		partialScores: UserMarks;
	} {
		// Empty papers (no questions)
		const emptyPapers: Paper[] = [{
			id: 'empty-paper-1',
			subject: 'Mathematics',
			board: 'AQA',
			year: 2023,
			session: 'Summer',
			variant: 'A',
			paperUrl: 'https://example.com/empty.pdf',
			markschemeUrl: 'https://example.com/empty-ms.pdf',
			questions: []
		}];

		// Single question papers
		const singleQuestion: Paper[] = [{
			id: 'single-question-1',
			subject: 'Physics',
			board: 'Edexcel',
			year: 2023,
			session: 'Winter',
			variant: 'B',
			paperUrl: 'https://example.com/single.pdf',
			markschemeUrl: 'https://example.com/single-ms.pdf',
			questions: [{ id: 1, marks: 50 }]
		}];

		// High marks papers
		const maxMarks: Paper[] = [{
			id: 'max-marks-1',
			subject: 'Chemistry',
			board: 'OCR',
			year: 2023,
			session: 'Summer',
			variant: 'C',
			paperUrl: 'https://example.com/max.pdf',
			markschemeUrl: 'https://example.com/max-ms.pdf',
			questions: [
				{ id: 1, marks: 100 },
				{ id: 2, marks: 200 },
				{ id: 3, marks: 150 }
			]
		}];

		// Perfect scores
		const perfectScores: UserMarks = {
			'single-question-1-1': 50,
			'max-marks-1-1': 100,
			'max-marks-1-2': 200,
			'max-marks-1-3': 150
		};

		// Zero scores
		const zeroScores: UserMarks = {
			'single-question-1-1': 0,
			'max-marks-1-1': 0,
			'max-marks-1-2': 0,
			'max-marks-1-3': 0
		};

		// Partial scores
		const partialScores: UserMarks = {
			'single-question-1-1': 25, // 50%
			'max-marks-1-1': 50,       // 50%
			'max-marks-1-2': 100,      // 50%
			// max-marks-1-3 not answered
		};

		return {
			emptyPapers,
			noPapers: [],
			singleQuestion,
			maxMarks,
			perfectScores,
			zeroScores,
			partialScores
		};
	}
}

// Pre-configured generators for common scenarios
export const generators = {
	/**
	 * Small dataset for unit tests
	 */
	small: new SampleDataGenerator({
		paperCount: 5,
		questionsPerPaper: 3,
		subjects: ['Mathematics', 'Physics'],
		boards: ['AQA', 'Edexcel'],
		years: [2023],
		completionRate: 1.0,
		averageScore: 75
	}),

	/**
	 * Medium dataset for integration tests
	 */
	medium: new SampleDataGenerator({
		paperCount: 20,
		questionsPerPaper: 6,
		subjects: ['Mathematics', 'Physics', 'Chemistry'],
		boards: ['AQA', 'Edexcel', 'OCR'],
		years: [2022, 2023],
		completionRate: 0.8,
		averageScore: 70
	}),

	/**
	 * Large dataset for performance tests
	 */
	large: new SampleDataGenerator({
		paperCount: 100,
		questionsPerPaper: 10,
		subjects: DEFAULT_SUBJECTS,
		boards: DEFAULT_BOARDS,
		years: [2020, 2021, 2022, 2023, 2024],
		completionRate: 0.6,
		averageScore: 68
	}),

	/**
	 * High performer profile
	 */
	highPerformer: new SampleDataGenerator({
		paperCount: 30,
		questionsPerPaper: 8,
		subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
		completionRate: 0.95,
		averageScore: 92
	}),

	/**
	 * Struggling student profile
	 */
	struggling: new SampleDataGenerator({
		paperCount: 15,
		questionsPerPaper: 6,
		subjects: ['Mathematics', 'Physics'],
		completionRate: 0.4,
		averageScore: 35
	})
};

// Export commonly used datasets
export function getSmallTestDataset() {
	return generators.small.generateCompleteDataset();
}

export function getMediumTestDataset() {
	return generators.medium.generateCompleteDataset();
}

export function getEdgeCaseDataset() {
	return new SampleDataGenerator().generateEdgeCases();
}

export function getPerformanceTestDataset(scenario: 'improving' | 'declining' | 'inconsistent' | 'high' | 'low' = 'improving') {
	const scenarios = {
		improving: { improving: true },
		declining: { declining: true },
		inconsistent: { inconsistent: true },
		high: { highPerformer: true },
		low: { lowPerformer: true }
	};

	return new SampleDataGenerator().generatePerformanceTestData(scenarios[scenario]);
}