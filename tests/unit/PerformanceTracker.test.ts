import { describe, it, expect, beforeEach } from 'vitest';
import { 
	calculatePaperStats, 
	formatPercentage, 
	calculateGrade,
	generateColor,
	type UserMarks 
} from '../../src/lib/utils';
import type { Paper } from '../../src/lib/pastPapers';

// Test the PerformanceTracker functionality without rendering the Svelte component
describe('PerformanceTracker Logic', () => {
	const mockPapers: Paper[] = [
		{
			id: 'math-2023-summer-1',
			subject: 'Mathematics',
			board: 'AQA',
			year: 2023,
			session: 'Summer',
			variant: '1',
			paperUrl: 'https://example.com/paper1.pdf',
			markschemeUrl: 'https://example.com/ms1.pdf',
			questions: [
				{ id: 1, marks: 10 },
				{ id: 2, marks: 15 },
				{ id: 3, marks: 20 }
			]
		},
		{
			id: 'physics-2023-winter-2',
			subject: 'Physics',
			board: 'Edexcel',
			year: 2023,
			session: 'Winter',
			variant: '2',
			paperUrl: 'https://example.com/paper2.pdf',
			markschemeUrl: 'https://example.com/ms2.pdf',
			questions: [
				{ id: 1, marks: 12 },
				{ id: 2, marks: 18 },
				{ id: 3, marks: 25 }
			]
		},
		{
			id: 'math-2022-summer-1',
			subject: 'Mathematics',
			board: 'AQA',
			year: 2022,
			session: 'Summer',
			variant: '1',
			paperUrl: 'https://example.com/paper3.pdf',
			markschemeUrl: 'https://example.com/ms3.pdf',
			questions: [
				{ id: 1, marks: 8 },
				{ id: 2, marks: 12 },
				{ id: 3, marks: 15 }
			]
		}
	];

	const mockUserMarks: UserMarks = {
		'math-2023-summer-1-1': 8,
		'math-2023-summer-1-2': 12,
		'math-2023-summer-1-3': 18,
		'physics-2023-winter-2-1': 10,
		'physics-2023-winter-2-2': 15,
		'physics-2023-winter-2-3': 20,
		'math-2022-summer-1-1': 6,
		'math-2022-summer-1-2': 10
		// Note: math-2022-summer-1-3 is not answered (incomplete paper)
	};

	describe('Performance Calculations', () => {
		it('should calculate paper statistics correctly', () => {
			const paper = mockPapers[0]; // Math paper with complete answers
			const stats = calculatePaperStats(paper.questions!, mockUserMarks, paper.id);

			expect(stats.totalQuestions).toBe(3);
			expect(stats.answeredQuestions).toBe(3);
			expect(stats.totalMarks).toBe(38); // 8 + 12 + 18
			expect(stats.maxMarks).toBe(45); // 10 + 15 + 20
			expect(stats.percentage).toBeCloseTo(84.44, 2);
			expect(stats.grade).toBe('A');
		});

		it('should handle incomplete papers correctly', () => {
			const paper = mockPapers[2]; // Math paper with incomplete answers
			const stats = calculatePaperStats(paper.questions!, mockUserMarks, paper.id);

			expect(stats.totalQuestions).toBe(3);
			expect(stats.answeredQuestions).toBe(2); // Only first two questions answered
			expect(stats.totalMarks).toBe(16); // 6 + 10 + 0
			expect(stats.maxMarks).toBe(35); // 8 + 12 + 15
			expect(stats.percentage).toBeCloseTo(45.71, 2);
			expect(stats.grade).toBe('E');
		});

		it('should filter papers by subject correctly', () => {
			const mathPapers = mockPapers.filter(paper => paper.subject === 'Mathematics');
			expect(mathPapers).toHaveLength(2);
			expect(mathPapers.every(paper => paper.subject === 'Mathematics')).toBe(true);
		});

		it('should filter papers by board correctly', () => {
			const aqaPapers = mockPapers.filter(paper => paper.board === 'AQA');
			expect(aqaPapers).toHaveLength(2);
			expect(aqaPapers.every(paper => paper.board === 'AQA')).toBe(true);
		});

		it('should calculate overall metrics correctly', () => {
			const attempted = mockPapers.filter(paper => {
				const paperKeys = Object.keys(mockUserMarks).filter(key => key.startsWith(paper.id));
				return paperKeys.length > 0;
			});

			const completed = mockPapers.filter(paper => {
				const questions = paper.questions || [];
				const answeredQuestions = questions.filter(q => {
					const key = `${paper.id}-${q.id}`;
					return mockUserMarks[key] > 0;
				});
				return answeredQuestions.length === questions.length;
			});

			expect(attempted).toHaveLength(3); // All papers have at least one answer
			expect(completed).toHaveLength(2); // Only first two papers are complete
		});
	});

	describe('Grade Distribution', () => {
		it('should calculate grade distribution correctly', () => {
			const grades = mockPapers.map(paper => {
				const stats = calculatePaperStats(paper.questions!, mockUserMarks, paper.id);
				return stats.grade;
			});

			const gradeDistribution = grades.reduce((acc, grade) => {
				acc[grade] = (acc[grade] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

			expect(gradeDistribution['A']).toBe(2); // Math and Physics papers
			expect(gradeDistribution['E']).toBe(1); // Incomplete math paper
		});
	});

	describe('Subject Breakdown', () => {
		it('should calculate subject statistics correctly', () => {
			const subjectStats = mockPapers.reduce((acc, paper) => {
				const subject = paper.subject;
				if (!acc[subject]) {
					acc[subject] = { attempted: 0, completed: 0, totalScore: 0, count: 0 };
				}

				const stats = calculatePaperStats(paper.questions!, mockUserMarks, paper.id);
				if (stats.answeredQuestions > 0) {
					acc[subject].attempted++;
					acc[subject].totalScore += stats.percentage;
					acc[subject].count++;
				}

				if (stats.answeredQuestions === (paper.questions?.length || 0)) {
					acc[subject].completed++;
				}

				return acc;
			}, {} as Record<string, any>);

			// Mathematics: 2 attempted, 1 completed
			expect(subjectStats['Mathematics'].attempted).toBe(2);
			expect(subjectStats['Mathematics'].completed).toBe(1);

			// Physics: 1 attempted, 1 completed
			expect(subjectStats['Physics'].attempted).toBe(1);
			expect(subjectStats['Physics'].completed).toBe(1);
		});
	});

	describe('Progress Data Generation', () => {
		it('should generate progress data over time', () => {
			const progressData = mockPapers
				.filter(paper => {
					const paperKeys = Object.keys(mockUserMarks).filter(key => key.startsWith(paper.id));
					return paperKeys.length > 0;
				})
				.map(paper => {
					const stats = calculatePaperStats(paper.questions!, mockUserMarks, paper.id);
					return {
						date: new Date().toISOString().split('T')[0],
						score: stats.percentage,
						paperId: paper.id,
						subject: paper.subject
					};
				});

			expect(progressData).toHaveLength(3);
			expect(progressData.every(d => d.score > 0)).toBe(true);
		});
	});

	describe('Utility Functions', () => {
		it('should format percentages correctly', () => {
			expect(formatPercentage(84.44)).toBe('84.4');
			expect(formatPercentage(100)).toBe('100');
			expect(formatPercentage(0)).toBe('0');
		});

		it('should calculate grades correctly', () => {
			expect(calculateGrade(95)).toBe('A*');
			expect(calculateGrade(85)).toBe('A');
			expect(calculateGrade(45)).toBe('E');
		});

		it('should generate consistent colors', () => {
			expect(generateColor(0)).toBe(generateColor(0));
			expect(generateColor(0)).toBe(generateColor(12)); // Should cycle
		});
	});

	describe('Edge Cases', () => {
		it('should handle papers with no questions', () => {
			const emptyPaper: Paper = {
				id: 'empty-paper',
				subject: 'Test',
				board: 'Test',
				year: 2023,
				session: 'Summer',
				variant: 'A',
				paperUrl: '',
				questions: []
			};

			const stats = calculatePaperStats([], mockUserMarks, emptyPaper.id);
			expect(stats.totalQuestions).toBe(0);
			expect(stats.percentage).toBe(0);
		});

		it('should handle empty user marks', () => {
			const paper = mockPapers[0];
			const stats = calculatePaperStats(paper.questions!, {}, paper.id);

			expect(stats.answeredQuestions).toBe(0);
			expect(stats.totalMarks).toBe(0);
			expect(stats.percentage).toBe(0);
		});

		it('should handle perfect scores', () => {
			const perfectMarks: UserMarks = {
				'math-2023-summer-1-1': 10,
				'math-2023-summer-1-2': 15,
				'math-2023-summer-1-3': 20
			};

			const paper = mockPapers[0];
			const stats = calculatePaperStats(paper.questions!, perfectMarks, paper.id);

			expect(stats.percentage).toBe(100);
			expect(stats.grade).toBe('A*');
		});
	});
});