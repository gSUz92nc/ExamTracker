import { describe, it, expect } from 'vitest';
import {
	calculatePaperStats,
	calculateGrade,
	formatPercentage,
	generateMarkKey,
	validateUserId,
	debounce,
	filterPapers,
	groupPapersBySubjectAndBoard,
	sortPapers,
	getUniqueSubjects,
	getUniqueExamBoards,
	calculateOverallProgress,
	safeJsonParse,
	formatDate,
	generateColor,
	type UserMarks
} from '../../src/lib/utils';

describe('calculatePaperStats', () => {
	const questions = [
		{ id: 1, marks: 10 },
		{ id: 2, marks: 15 },
		{ id: 3, marks: 20 }
	];

	it('should calculate stats correctly with some answers', () => {
		const userMarks: UserMarks = {
			'paper1-1': 8,
			'paper1-2': 12,
			'paper1-3': 0
		};

		const stats = calculatePaperStats(questions, userMarks, 'paper1');

		expect(stats.totalQuestions).toBe(3);
		expect(stats.answeredQuestions).toBe(2);
		expect(stats.totalMarks).toBe(20);
		expect(stats.maxMarks).toBe(45);
		expect(stats.percentage).toBeCloseTo(44.44, 2);
		expect(stats.grade).toBe('F');
	});

	it('should handle empty answers', () => {
		const userMarks: UserMarks = {};
		const stats = calculatePaperStats(questions, userMarks, 'paper1');

		expect(stats.totalQuestions).toBe(3);
		expect(stats.answeredQuestions).toBe(0);
		expect(stats.totalMarks).toBe(0);
		expect(stats.maxMarks).toBe(45);
		expect(stats.percentage).toBe(0);
		expect(stats.grade).toBe('U');
	});

	it('should handle perfect score', () => {
		const userMarks: UserMarks = {
			'paper1-1': 10,
			'paper1-2': 15,
			'paper1-3': 20
		};

		const stats = calculatePaperStats(questions, userMarks, 'paper1');

		expect(stats.totalQuestions).toBe(3);
		expect(stats.answeredQuestions).toBe(3);
		expect(stats.totalMarks).toBe(45);
		expect(stats.maxMarks).toBe(45);
		expect(stats.percentage).toBe(100);
		expect(stats.grade).toBe('A*');
	});
});

describe('calculateGrade', () => {
	it('should return correct grades for different percentages', () => {
		expect(calculateGrade(95)).toBe('A*');
		expect(calculateGrade(90)).toBe('A*');
		expect(calculateGrade(85)).toBe('A');
		expect(calculateGrade(80)).toBe('A');
		expect(calculateGrade(75)).toBe('B');
		expect(calculateGrade(70)).toBe('B');
		expect(calculateGrade(65)).toBe('C');
		expect(calculateGrade(60)).toBe('C');
		expect(calculateGrade(55)).toBe('D');
		expect(calculateGrade(50)).toBe('D');
		expect(calculateGrade(45)).toBe('E');
		expect(calculateGrade(40)).toBe('E');
		expect(calculateGrade(35)).toBe('F');
		expect(calculateGrade(30)).toBe('F');
		expect(calculateGrade(25)).toBe('U');
		expect(calculateGrade(0)).toBe('U');
	});
});

describe('formatPercentage', () => {
	it('should format whole numbers without decimals', () => {
		expect(formatPercentage(85)).toBe('85');
		expect(formatPercentage(100)).toBe('100');
		expect(formatPercentage(0)).toBe('0');
	});

	it('should format decimals with one decimal place', () => {
		expect(formatPercentage(85.5)).toBe('85.5');
		expect(formatPercentage(67.8)).toBe('67.8');
		expect(formatPercentage(33.333)).toBe('33.3');
	});
});

describe('generateMarkKey', () => {
	it('should generate correct keys', () => {
		expect(generateMarkKey('paper1', 5)).toBe('paper1-5');
		expect(generateMarkKey('math-2023-summer', 12)).toBe('math-2023-summer-12');
	});
});

describe('validateUserId', () => {
	it('should validate correct user IDs', () => {
		expect(validateUserId('user123')).toEqual({ isValid: true });
		expect(validateUserId('test_user')).toEqual({ isValid: true });
		expect(validateUserId('user-name')).toEqual({ isValid: true });
		expect(validateUserId('validUser123')).toEqual({ isValid: true });
	});

	it('should reject invalid user IDs', () => {
		expect(validateUserId('')).toEqual({ 
			isValid: false, 
			message: 'User ID is required' 
		});
		
		expect(validateUserId('ab')).toEqual({ 
			isValid: false, 
			message: 'User ID must be at least 3 characters long' 
		});
		
		expect(validateUserId('a'.repeat(51))).toEqual({ 
			isValid: false, 
			message: 'User ID must be less than 50 characters' 
		});
		
		expect(validateUserId('user@name')).toEqual({ 
			isValid: false, 
			message: 'User ID can only contain letters, numbers, hyphens, and underscores' 
		});
		
		expect(validateUserId('user name')).toEqual({ 
			isValid: false, 
			message: 'User ID can only contain letters, numbers, hyphens, and underscores' 
		});
	});

	it('should handle edge cases', () => {
		expect(validateUserId(null as any)).toEqual({ 
			isValid: false, 
			message: 'User ID is required' 
		});
		
		expect(validateUserId(undefined as any)).toEqual({ 
			isValid: false, 
			message: 'User ID is required' 
		});
		
		expect(validateUserId('   ')).toEqual({ 
			isValid: false, 
			message: 'User ID is required' 
		});
	});
});

describe('debounce', () => {
	it('should debounce function calls', async () => {
		let callCount = 0;
		const fn = () => callCount++;
		const debouncedFn = debounce(fn, 100);

		debouncedFn();
		debouncedFn();
		debouncedFn();

		expect(callCount).toBe(0);

		await new Promise(resolve => setTimeout(resolve, 150));
		expect(callCount).toBe(1);
	});

	it('should pass arguments correctly', async () => {
		let lastArgs: any[] = [];
		const fn = (...args: any[]) => { lastArgs = args; };
		const debouncedFn = debounce(fn, 50);

		debouncedFn('arg1', 'arg2', 123);
		
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(lastArgs).toEqual(['arg1', 'arg2', 123]);
	});
});

describe('filterPapers', () => {
	const papers = [
		{ subject: 'Mathematics', board: 'AQA', year: 2023, session: 'Summer', variant: 'A' },
		{ subject: 'Physics', board: 'Edexcel', year: 2023, session: 'Winter', variant: 'B' },
		{ subject: 'Chemistry', board: 'AQA', year: 2022, session: 'Summer', variant: 'A' },
		{ subject: 'Mathematics', board: 'OCR', year: 2022, session: 'Winter', variant: 'C' }
	];

	it('should filter by search query', () => {
		expect(filterPapers(papers, 'math', null, null)).toHaveLength(2);
		expect(filterPapers(papers, '2023', null, null)).toHaveLength(2);
		expect(filterPapers(papers, 'AQA', null, null)).toHaveLength(2);
		expect(filterPapers(papers, 'summer', null, null)).toHaveLength(2);
	});

	it('should filter by subject', () => {
		expect(filterPapers(papers, '', 'Mathematics', null)).toHaveLength(2);
		expect(filterPapers(papers, '', 'Physics', null)).toHaveLength(1);
	});

	it('should filter by board', () => {
		expect(filterPapers(papers, '', null, 'AQA')).toHaveLength(2);
		expect(filterPapers(papers, '', null, 'OCR')).toHaveLength(1);
	});

	it('should combine filters', () => {
		expect(filterPapers(papers, 'math', 'Mathematics', 'AQA')).toHaveLength(1);
		expect(filterPapers(papers, '2023', 'Physics', 'Edexcel')).toHaveLength(1);
	});

	it('should return empty array when no matches', () => {
		expect(filterPapers(papers, 'nonexistent', null, null)).toHaveLength(0);
	});
});

describe('groupPapersBySubjectAndBoard', () => {
	const papers = [
		{ subject: 'Mathematics', board: 'AQA', year: 2023 },
		{ subject: 'Mathematics', board: 'AQA', year: 2022 },
		{ subject: 'Physics', board: 'Edexcel', year: 2023 },
		{ subject: 'Mathematics', board: 'OCR', year: 2023 }
	];

	it('should group papers correctly', () => {
		const grouped = groupPapersBySubjectAndBoard(papers);
		
		expect(Object.keys(grouped)).toHaveLength(3);
		expect(grouped['Mathematics - AQA']).toHaveLength(2);
		expect(grouped['Physics - Edexcel']).toHaveLength(1);
		expect(grouped['Mathematics - OCR']).toHaveLength(1);
	});
});

describe('sortPapers', () => {
	const papers = [
		{ year: 2022, session: 'Winter', variant: 'B' },
		{ year: 2023, session: 'Summer', variant: 'A' },
		{ year: 2022, session: 'Summer', variant: 'A' },
		{ year: 2023, session: 'Winter', variant: 'A' },
		{ year: 2023, session: 'Summer', variant: 'B' }
	];

	it('should sort papers by year (desc), session, variant', () => {
		const sorted = sortPapers(papers);
		
		expect(sorted[0]).toEqual({ year: 2023, session: 'Summer', variant: 'A' });
		expect(sorted[1]).toEqual({ year: 2023, session: 'Summer', variant: 'B' });
		expect(sorted[2]).toEqual({ year: 2023, session: 'Winter', variant: 'A' });
		expect(sorted[3]).toEqual({ year: 2022, session: 'Summer', variant: 'A' });
		expect(sorted[4]).toEqual({ year: 2022, session: 'Winter', variant: 'B' });
	});

	it('should not mutate original array', () => {
		const original = [...papers];
		sortPapers(papers);
		expect(papers).toEqual(original);
	});
});

describe('getUniqueSubjects', () => {
	const papers = [
		{ subject: 'Mathematics' },
		{ subject: 'Physics' },
		{ subject: 'Mathematics' },
		{ subject: 'Chemistry' }
	];

	it('should return unique subjects sorted alphabetically', () => {
		const subjects = getUniqueSubjects(papers);
		
		expect(subjects).toHaveLength(3);
		expect(subjects[0]).toEqual({ id: 'Chemistry', name: 'Chemistry' });
		expect(subjects[1]).toEqual({ id: 'Mathematics', name: 'Mathematics' });
		expect(subjects[2]).toEqual({ id: 'Physics', name: 'Physics' });
	});
});

describe('getUniqueExamBoards', () => {
	const papers = [
		{ board: 'AQA' },
		{ board: 'Edexcel' },
		{ board: 'AQA' },
		{ board: 'OCR' }
	];

	it('should return unique exam boards sorted alphabetically', () => {
		const boards = getUniqueExamBoards(papers);
		
		expect(boards).toHaveLength(3);
		expect(boards[0]).toEqual({ id: 'AQA', name: 'AQA' });
		expect(boards[1]).toEqual({ id: 'Edexcel', name: 'Edexcel' });
		expect(boards[2]).toEqual({ id: 'OCR', name: 'OCR' });
	});
});

describe('safeJsonParse', () => {
	it('should parse valid JSON', () => {
		expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
		expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
	});

	it('should return fallback for invalid JSON', () => {
		expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true });
		expect(safeJsonParse('', [])).toEqual([]);
		expect(safeJsonParse(null, { fallback: true })).toEqual({ fallback: true });
	});
});

describe('formatDate', () => {
	it('should format date correctly', () => {
		const date = new Date('2023-12-25T14:30:00');
		const formatted = formatDate(date);
		
		// Format should be DD/MM/YYYY, HH:MM
		expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
	});
});

describe('generateColor', () => {
	it('should return consistent colors for same index', () => {
		expect(generateColor(0)).toBe(generateColor(0));
		expect(generateColor(5)).toBe(generateColor(5));
	});

	it('should cycle through colors', () => {
		const color0 = generateColor(0);
		const color12 = generateColor(12); // Should be same as index 0
		expect(color0).toBe(color12);
	});

	it('should return valid hex colors', () => {
		for (let i = 0; i < 15; i++) {
			const color = generateColor(i);
			expect(color).toMatch(/^#[0-9A-F]{6}$/i);
		}
	});
});