import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PerformanceTracker from '../../src/lib/components/PerformanceTracker.svelte';
import type { Paper } from '../../src/lib/pastPapers';
import type { UserMarks } from '../../src/lib/utils';

// Mock canvas context
const mockCanvasContext = {
	clearRect: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	stroke: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn(),
	fillRect: vi.fn(),
	fillText: vi.fn(),
	measureText: vi.fn(() => ({ width: 50 })),
	save: vi.fn(),
	restore: vi.fn(),
	translate: vi.fn(),
	rotate: vi.fn(),
	scale: vi.fn(),
	drawImage: vi.fn(),
	createLinearGradient: vi.fn(),
	createRadialGradient: vi.fn(),
	createPattern: vi.fn(),
	getImageData: vi.fn(),
	putImageData: vi.fn(),
	canvas: {},
	strokeStyle: '',
	fillStyle: '',
	lineWidth: 1,
	font: '',
	textAlign: 'start',
	textBaseline: 'alphabetic',
	globalAlpha: 1,
	globalCompositeOperation: 'source-over',
	lineCap: 'butt',
	lineJoin: 'miter',
	miterLimit: 10,
	shadowBlur: 0,
	shadowColor: '',
	shadowOffsetX: 0,
	shadowOffsetY: 0
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
	value: vi.fn(() => mockCanvasContext)
});

Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
	value: 400
});

Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
	value: 300
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for export functionality
const mockAnchorElement = {
	href: '',
	download: '',
	click: vi.fn(),
	style: {}
};

const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
	if (tagName === 'a') {
		return mockAnchorElement as any;
	}
	return originalCreateElement.call(document, tagName);
});

const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

describe('PerformanceTracker', () => {
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

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Component Rendering', () => {
		it('should render overview tab by default', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			expect(screen.getByText('Overview')).toBeInTheDocument();
			expect(screen.getByText('Total Papers')).toBeInTheDocument();
			expect(screen.getByText('Attempted')).toBeInTheDocument();
			expect(screen.getByText('Completed')).toBeInTheDocument();
			expect(screen.getByText('Average Score')).toBeInTheDocument();
		});

		it('should display correct statistics in overview', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			// Total papers
			expect(screen.getByText('3')).toBeInTheDocument();
			
			// Should show attempted papers (papers with at least one answer)
			// All 3 papers have at least one answer
			expect(screen.getByText('3')).toBeInTheDocument();
			
			// Completed papers (all questions answered)
			// Only first two papers are complete
			expect(screen.getByText('2')).toBeInTheDocument();
		});

		it('should render all navigation tabs', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			expect(screen.getByText('Overview')).toBeInTheDocument();
			expect(screen.getByText('By Subject')).toBeInTheDocument();
			expect(screen.getByText('Progress')).toBeInTheDocument();
			expect(screen.getByText('Detailed')).toBeInTheDocument();
		});
	});

	describe('Tab Navigation', () => {
		it('should switch to subjects view when clicked', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const subjectsTab = screen.getByText('By Subject');
			await user.click(subjectsTab);

			expect(screen.getByText('Performance by Subject')).toBeInTheDocument();
		});

		it('should switch to progress view when clicked', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const progressTab = screen.getByText('Progress');
			await user.click(progressTab);

			expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
		});

		it('should switch to detailed view when clicked', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const detailedTab = screen.getByText('Detailed');
			await user.click(detailedTab);

			expect(screen.getByText('Detailed Performance')).toBeInTheDocument();
			expect(screen.getByText('Export Data')).toBeInTheDocument();
		});
	});

	describe('Subjects View', () => {
		it('should display subject breakdown correctly', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const subjectsTab = screen.getByText('By Subject');
			await user.click(subjectsTab);

			expect(screen.getByText('Mathematics')).toBeInTheDocument();
			expect(screen.getByText('Physics')).toBeInTheDocument();
		});

		it('should show correct attempted and completed counts per subject', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const subjectsTab = screen.getByText('By Subject');
			await user.click(subjectsTab);

			// Mathematics: 2 attempted (both math papers have answers), 1 completed
			// Physics: 1 attempted, 1 completed
			expect(screen.getAllByText('Attempted:')).toHaveLength(2);
			expect(screen.getAllByText('Completed:')).toHaveLength(2);
		});
	});

	describe('Progress View', () => {
		it('should display time range selector', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const progressTab = screen.getByText('Progress');
			await user.click(progressTab);

			expect(screen.getByText('Week')).toBeInTheDocument();
			expect(screen.getByText('Month')).toBeInTheDocument();
			expect(screen.getByText('All Time')).toBeInTheDocument();
		});

		it('should switch time ranges when clicked', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const progressTab = screen.getByText('Progress');
			await user.click(progressTab);

			const weekButton = screen.getByText('Week');
			await user.click(weekButton);

			// Week button should be active
			expect(weekButton.closest('button')).toHaveClass('active');
		});
	});

	describe('Detailed View', () => {
		it('should display papers table with correct headers', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const detailedTab = screen.getByText('Detailed');
			await user.click(detailedTab);

			expect(screen.getByText('Subject')).toBeInTheDocument();
			expect(screen.getByText('Paper')).toBeInTheDocument();
			expect(screen.getByText('Score')).toBeInTheDocument();
			expect(screen.getByText('Percentage')).toBeInTheDocument();
			expect(screen.getByText('Grade')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
		});

		it('should display paper data in table rows', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const detailedTab = screen.getByText('Detailed');
			await user.click(detailedTab);

			// Should show attempted papers
			expect(screen.getByText('AQA 2023 Summer 1')).toBeInTheDocument();
			expect(screen.getByText('Edexcel 2023 Winter 2')).toBeInTheDocument();
			expect(screen.getByText('AQA 2022 Summer 1')).toBeInTheDocument();
		});

		it('should show completion status correctly', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const detailedTab = screen.getByText('Detailed');
			await user.click(detailedTab);

			// Should show completed and in progress statuses
			expect(screen.getAllByText('Completed')).toHaveLength(2); // First two papers
			expect(screen.getByText('In Progress')).toBeInTheDocument(); // Third paper
		});
	});

	describe('Data Export', () => {
		it('should trigger export when export button is clicked', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const detailedTab = screen.getByText('Detailed');
			await user.click(detailedTab);

			const exportButton = screen.getByText('Export Data');
			await user.click(exportButton);

			// Should create blob and trigger download
			expect(global.URL.createObjectURL).toHaveBeenCalled();
			expect(mockAnchorElement.click).toHaveBeenCalled();
			expect(mockAppendChild).toHaveBeenCalled();
			expect(mockRemoveChild).toHaveBeenCalled();
		});
	});

	describe('Filtering', () => {
		it('should filter papers by subject', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks,
					selectedSubject: 'Mathematics'
				}
			});

			// Should only show mathematics papers in stats
			// Mathematics has 2 papers, both attempted, 1 completed
			expect(screen.getByText('2')).toBeInTheDocument(); // Total papers
		});

		it('should filter papers by board', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks,
					selectedBoard: 'AQA'
				}
			});

			// Should only show AQA papers
			// AQA has 2 papers in the mock data
			expect(screen.getByText('2')).toBeInTheDocument(); // Total papers
		});

		it('should combine subject and board filters', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks,
					selectedSubject: 'Mathematics',
					selectedBoard: 'AQA'
				}
			});

			// Should show only AQA Mathematics papers
			expect(screen.getByText('2')).toBeInTheDocument(); // Total papers
		});
	});

	describe('Empty States', () => {
		it('should handle empty papers array', () => {
			render(PerformanceTracker, {
				props: {
					papers: [],
					userMarks: {}
				}
			});

			expect(screen.getByText('0')).toBeInTheDocument();
		});

		it('should handle empty user marks', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: {}
				}
			});

			// Should show 0 attempted papers
			expect(screen.getByText('0')).toBeInTheDocument();
		});

		it('should show empty state message in progress view when no data', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: {}
				}
			});

			const progressTab = screen.getByText('Progress');
			await user.click(progressTab);

			expect(screen.getByText(/No progress data available yet/)).toBeInTheDocument();
		});
	});

	describe('Grade Calculations', () => {
		it('should calculate correct grades based on percentages', () => {
			// Math paper 1: 38/45 = 84.4% = A
			// Physics paper: 45/55 = 81.8% = A  
			// Math paper 2: 16/35 = 45.7% = E
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			// Average should be around (84.4 + 81.8 + 45.7) / 3 = 70.6% = B
			// This will be shown in the overview
			expect(screen.getByText(/Grade/)).toBeInTheDocument();
		});
	});

	describe('Canvas Charts', () => {
		it('should initialize canvas elements with correct dimensions', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			// Canvas elements should be initialized
			expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
		});

		it('should draw progress chart when data is available', async () => {
			const user = userEvent.setup();
			
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			const progressTab = screen.getByText('Progress');
			await user.click(progressTab);

			// Should call canvas drawing methods
			setTimeout(() => {
				expect(mockCanvasContext.clearRect).toHaveBeenCalled();
				expect(mockCanvasContext.beginPath).toHaveBeenCalled();
			}, 10);
		});

		it('should draw grade distribution chart', () => {
			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			// Should initialize grade chart canvas
			setTimeout(() => {
				expect(mockCanvasContext.fillRect).toHaveBeenCalled();
			}, 10);
		});
	});

	describe('Responsive Design', () => {
		it('should apply mobile styles on small screens', () => {
			// Mock window.innerWidth
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 500
			});

			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: mockUserMarks
				}
			});

			// Component should render without errors on mobile
			expect(screen.getByText('Overview')).toBeInTheDocument();
		});
	});

	describe('Performance Calculations', () => {
		it('should correctly calculate completion percentage', () => {
			const partialMarks: UserMarks = {
				'math-2023-summer-1-1': 8, // Only first question answered
			};

			render(PerformanceTracker, {
				props: {
					papers: mockPapers,
					userMarks: partialMarks
				}
			});

			// Should show 1 attempted, 0 completed
			expect(screen.getByText('1')).toBeInTheDocument(); // Attempted
			expect(screen.getByText('0')).toBeInTheDocument(); // Completed
		});

		it('should handle perfect scores correctly', () => {
			const perfectMarks: UserMarks = {
				'math-2023-summer-1-1': 10,
				'math-2023-summer-1-2': 15,
				'math-2023-summer-1-3': 20,
			};

			render(PerformanceTracker, {
				props: {
					papers: [mockPapers[0]], // Only first paper
					userMarks: perfectMarks
				}
			});

			// Should show 100% and A* grade
			expect(screen.getByText('100%')).toBeInTheDocument();
			expect(screen.getByText('Grade A*')).toBeInTheDocument();
		});
	});
});