<script lang="ts">
	import { onMount } from 'svelte';
	import { calculatePaperStats, formatPercentage, calculateGrade, generateColor, type UserMarks } from '../utils';
	import type { Paper, Question } from '../pastPapers';

	export let papers: Paper[];
	export let userMarks: UserMarks;
	export let selectedSubject: string | null = null;
	export let selectedBoard: string | null = null;

	interface PaperPerformance {
		paper: Paper;
		stats: {
			totalQuestions: number;
			answeredQuestions: number;
			totalMarks: number;
			maxMarks: number;
			percentage: number;
			grade: string;
		};
		isCompleted: boolean;
		lastUpdated: Date | null;
	}

	interface PerformanceMetrics {
		totalPapers: number;
		attemptedPapers: number;
		completedPapers: number;
		averageScore: number;
		averageGrade: string;
		subjectBreakdown: Record<string, {
			attempted: number;
			completed: number;
			averageScore: number;
		}>;
		gradeDistribution: Record<string, number>;
		progressOverTime: Array<{
			date: string;
			score: number;
			paperId: string;
		}>;
	}

	let performanceData: PaperPerformance[] = $state([]);
	let metrics: PerformanceMetrics = $state({
		totalPapers: 0,
		attemptedPapers: 0,
		completedPapers: 0,
		averageScore: 0,
		averageGrade: 'U',
		subjectBreakdown: {},
		gradeDistribution: {},
		progressOverTime: []
	});

	let chartCanvas: HTMLCanvasElement;
	let gradeChartCanvas: HTMLCanvasElement;
	let selectedTimeRange = $state<'week' | 'month' | 'all'>('month');
	let selectedView = $state<'overview' | 'subjects' | 'progress' | 'detailed'>('overview');

	// Calculate performance data when props change
	$effect(() => {
		calculatePerformanceData();
	});

	function calculatePerformanceData(): void {
		const filteredPapers = papers.filter(paper => {
			const matchesSubject = !selectedSubject || paper.subject === selectedSubject;
			const matchesBoard = !selectedBoard || paper.board === selectedBoard;
			return matchesSubject && matchesBoard;
		});

		performanceData = filteredPapers.map(paper => {
			const questions: Question[] = paper.questions || [];
			const stats = calculatePaperStats(questions, userMarks, paper.id);
			
			// Check if paper is completed (all questions answered)
			const isCompleted = questions.length > 0 && stats.answeredQuestions === questions.length;
			
			// Get last update time for this paper
			const paperKeys = Object.keys(userMarks).filter(key => key.startsWith(paper.id));
			const lastUpdated = paperKeys.length > 0 ? new Date() : null; // Simplified - would track actual timestamps

			return {
				paper,
				stats,
				isCompleted,
				lastUpdated
			};
		});

		calculateMetrics();
	}

	function calculateMetrics(): void {
		const attempted = performanceData.filter(p => p.stats.answeredQuestions > 0);
		const completed = performanceData.filter(p => p.isCompleted);

		// Calculate average score
		const totalScore = attempted.reduce((sum, p) => sum + p.stats.percentage, 0);
		const averageScore = attempted.length > 0 ? totalScore / attempted.length : 0;

		// Subject breakdown
		const subjectBreakdown: Record<string, any> = {};
		performanceData.forEach(p => {
			const subject = p.paper.subject;
			if (!subjectBreakdown[subject]) {
				subjectBreakdown[subject] = { attempted: 0, completed: 0, totalScore: 0, count: 0 };
			}
			
			if (p.stats.answeredQuestions > 0) {
				subjectBreakdown[subject].attempted++;
				subjectBreakdown[subject].totalScore += p.stats.percentage;
				subjectBreakdown[subject].count++;
			}
			
			if (p.isCompleted) {
				subjectBreakdown[subject].completed++;
			}
		});

		// Calculate average scores for subjects
		Object.keys(subjectBreakdown).forEach(subject => {
			const data = subjectBreakdown[subject];
			data.averageScore = data.count > 0 ? data.totalScore / data.count : 0;
		});

		// Grade distribution
		const gradeDistribution: Record<string, number> = {};
		attempted.forEach(p => {
			const grade = p.stats.grade;
			gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
		});

		// Progress over time (simplified)
		const progressOverTime = attempted
			.filter(p => p.lastUpdated)
			.map(p => ({
				date: p.lastUpdated!.toISOString().split('T')[0],
				score: p.stats.percentage,
				paperId: p.paper.id
			}))
			.sort((a, b) => a.date.localeCompare(b.date));

		metrics = {
			totalPapers: performanceData.length,
			attemptedPapers: attempted.length,
			completedPapers: completed.length,
			averageScore,
			averageGrade: calculateGrade(averageScore),
			subjectBreakdown,
			gradeDistribution,
			progressOverTime
		};
	}

	function drawProgressChart(): void {
		if (!chartCanvas || metrics.progressOverTime.length === 0) return;

		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		const width = chartCanvas.width;
		const height = chartCanvas.height;
		const padding = 40;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Filter data based on time range
		const now = new Date();
		const cutoffDate = new Date();
		switch (selectedTimeRange) {
			case 'week':
				cutoffDate.setDate(now.getDate() - 7);
				break;
			case 'month':
				cutoffDate.setMonth(now.getMonth() - 1);
				break;
		}

		const filteredData = selectedTimeRange === 'all' 
			? metrics.progressOverTime 
			: metrics.progressOverTime.filter(d => new Date(d.date) >= cutoffDate);

		if (filteredData.length === 0) return;

		// Calculate scales
		const maxScore = Math.max(...filteredData.map(d => d.score), 100);
		const minScore = Math.min(...filteredData.map(d => d.score), 0);
		const scoreRange = maxScore - minScore || 1;

		const xScale = (width - 2 * padding) / (filteredData.length - 1 || 1);
		const yScale = (height - 2 * padding) / scoreRange;

		// Draw axes
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(padding, padding);
		ctx.lineTo(padding, height - padding);
		ctx.stroke();

		// X-axis
		ctx.beginPath();
		ctx.moveTo(padding, height - padding);
		ctx.lineTo(width - padding, height - padding);
		ctx.stroke();

		// Draw grid lines
		ctx.strokeStyle = '#f1f5f9';
		for (let i = 0; i <= 5; i++) {
			const y = padding + (i * (height - 2 * padding)) / 5;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		// Draw progress line
		if (filteredData.length > 1) {
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 2;
			ctx.beginPath();

			filteredData.forEach((point, index) => {
				const x = padding + index * xScale;
				const y = height - padding - (point.score - minScore) * yScale;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.stroke();
		}

		// Draw data points
		ctx.fillStyle = '#3b82f6';
		filteredData.forEach((point, index) => {
			const x = padding + index * xScale;
			const y = height - padding - (point.score - minScore) * yScale;

			ctx.beginPath();
			ctx.arc(x, y, 4, 0, 2 * Math.PI);
			ctx.fill();
		});

		// Draw labels
		ctx.fillStyle = '#64748b';
		ctx.font = '12px sans-serif';
		ctx.textAlign = 'center';

		// Y-axis labels
		for (let i = 0; i <= 5; i++) {
			const value = minScore + (i * scoreRange) / 5;
			const y = height - padding - (i * (height - 2 * padding)) / 5;
			
			ctx.textAlign = 'right';
			ctx.fillText(value.toFixed(0) + '%', padding - 10, y + 4);
		}

		// X-axis labels (simplified)
		ctx.textAlign = 'center';
		if (filteredData.length > 0) {
			const firstDate = new Date(filteredData[0].date).toLocaleDateString();
			const lastDate = new Date(filteredData[filteredData.length - 1].date).toLocaleDateString();
			
			ctx.fillText(firstDate, padding, height - 10);
			ctx.fillText(lastDate, width - padding, height - 10);
		}
	}

	function drawGradeChart(): void {
		if (!gradeChartCanvas || Object.keys(metrics.gradeDistribution).length === 0) return;

		const ctx = gradeChartCanvas.getContext('2d');
		if (!ctx) return;

		const width = gradeChartCanvas.width;
		const height = gradeChartCanvas.height;
		const padding = 20;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		const grades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
		const gradeData = grades.map(grade => metrics.gradeDistribution[grade] || 0);
		const maxCount = Math.max(...gradeData, 1);

		const barWidth = (width - 2 * padding) / grades.length;
		const barScale = (height - 2 * padding) / maxCount;

		// Draw bars
		gradeData.forEach((count, index) => {
			const x = padding + index * barWidth;
			const barHeight = count * barScale;
			const y = height - padding - barHeight;

			// Bar
			ctx.fillStyle = generateColor(index);
			ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

			// Grade label
			ctx.fillStyle = '#374151';
			ctx.font = '12px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(grades[index], x + barWidth / 2, height - 5);

			// Count label
			if (count > 0) {
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 10px sans-serif';
				ctx.fillText(count.toString(), x + barWidth / 2, y + 15);
			}
		});
	}

	onMount(() => {
		if (chartCanvas) {
			chartCanvas.width = chartCanvas.offsetWidth * 2;
			chartCanvas.height = chartCanvas.offsetHeight * 2;
			chartCanvas.style.width = chartCanvas.offsetWidth / 2 + 'px';
			chartCanvas.style.height = chartCanvas.offsetHeight / 2 + 'px';
		}

		if (gradeChartCanvas) {
			gradeChartCanvas.width = gradeChartCanvas.offsetWidth * 2;
			gradeChartCanvas.height = gradeChartCanvas.offsetHeight * 2;
			gradeChartCanvas.style.width = gradeChartCanvas.offsetWidth / 2 + 'px';
			gradeChartCanvas.style.height = gradeChartCanvas.offsetHeight / 2 + 'px';
		}
	});

	// Redraw charts when data changes
	$effect(() => {
		if (metrics.progressOverTime.length > 0) {
			setTimeout(drawProgressChart, 0);
		}
		if (Object.keys(metrics.gradeDistribution).length > 0) {
			setTimeout(drawGradeChart, 0);
		}
	});

	function exportPerformanceData(): void {
		const data = {
			timestamp: new Date().toISOString(),
			metrics,
			detailedData: performanceData.map(p => ({
				paperId: p.paper.id,
				subject: p.paper.subject,
				board: p.paper.board,
				year: p.paper.year,
				session: p.paper.session,
				variant: p.paper.variant,
				score: p.stats.totalMarks,
				maxScore: p.stats.maxMarks,
				percentage: p.stats.percentage,
				grade: p.stats.grade,
				completed: p.isCompleted
			}))
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `exam-performance-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="performance-tracker">
	<!-- Navigation -->
	<div class="view-selector">
		<button 
			class="view-button"
			class:active={selectedView === 'overview'}
			onclick={() => selectedView = 'overview'}
		>
			Overview
		</button>
		<button 
			class="view-button"
			class:active={selectedView === 'subjects'}
			onclick={() => selectedView = 'subjects'}
		>
			By Subject
		</button>
		<button 
			class="view-button"
			class:active={selectedView === 'progress'}
			onclick={() => selectedView = 'progress'}
		>
			Progress
		</button>
		<button 
			class="view-button"
			class:active={selectedView === 'detailed'}
			onclick={() => selectedView = 'detailed'}
		>
			Detailed
		</button>
	</div>

	{#if selectedView === 'overview'}
		<!-- Overview Statistics -->
		<div class="stats-grid">
			<div class="stat-card">
				<h3>Total Papers</h3>
				<div class="stat-value">{metrics.totalPapers}</div>
			</div>
			
			<div class="stat-card">
				<h3>Attempted</h3>
				<div class="stat-value">{metrics.attemptedPapers}</div>
				<div class="stat-subtitle">
					{metrics.totalPapers > 0 ? ((metrics.attemptedPapers / metrics.totalPapers) * 100).toFixed(0) : 0}% of total
				</div>
			</div>
			
			<div class="stat-card">
				<h3>Completed</h3>
				<div class="stat-value">{metrics.completedPapers}</div>
				<div class="stat-subtitle">
					{metrics.attemptedPapers > 0 ? ((metrics.completedPapers / metrics.attemptedPapers) * 100).toFixed(0) : 0}% of attempted
				</div>
			</div>
			
			<div class="stat-card">
				<h3>Average Score</h3>
				<div class="stat-value">{formatPercentage(metrics.averageScore)}%</div>
				<div class="stat-subtitle grade-{metrics.averageGrade.toLowerCase().replace('*', 'star')}">
					Grade {metrics.averageGrade}
				</div>
			</div>
		</div>

		<!-- Grade Distribution Chart -->
		{#if Object.keys(metrics.gradeDistribution).length > 0}
			<div class="chart-section">
				<h3>Grade Distribution</h3>
				<canvas bind:this={gradeChartCanvas} class="grade-chart"></canvas>
			</div>
		{/if}

	{:else if selectedView === 'subjects'}
		<!-- Subject Breakdown -->
		<div class="subjects-section">
			<h3>Performance by Subject</h3>
			<div class="subjects-grid">
				{#each Object.entries(metrics.subjectBreakdown) as [subject, data]}
					<div class="subject-card">
						<h4>{subject}</h4>
						<div class="subject-stats">
							<div class="subject-stat">
								<span class="label">Attempted:</span>
								<span class="value">{data.attempted}</span>
							</div>
							<div class="subject-stat">
								<span class="label">Completed:</span>
								<span class="value">{data.completed}</span>
							</div>
							<div class="subject-stat">
								<span class="label">Average:</span>
								<span class="value">{formatPercentage(data.averageScore)}%</span>
							</div>
							<div class="subject-stat">
								<span class="label">Grade:</span>
								<span class="value grade-{calculateGrade(data.averageScore).toLowerCase().replace('*', 'star')}">
									{calculateGrade(data.averageScore)}
								</span>
							</div>
						</div>
						<div class="subject-progress">
							<div 
								class="progress-bar"
								style="width: {data.attempted > 0 ? (data.completed / data.attempted) * 100 : 0}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

	{:else if selectedView === 'progress'}
		<!-- Progress Over Time -->
		<div class="progress-section">
			<div class="progress-header">
				<h3>Progress Over Time</h3>
				<div class="time-range-selector">
					<button 
						class="time-button"
						class:active={selectedTimeRange === 'week'}
						onclick={() => selectedTimeRange = 'week'}
					>
						Week
					</button>
					<button 
						class="time-button"
						class:active={selectedTimeRange === 'month'}
						onclick={() => selectedTimeRange = 'month'}
					>
						Month
					</button>
					<button 
						class="time-button"
						class:active={selectedTimeRange === 'all'}
						onclick={() => selectedTimeRange = 'all'}
					>
						All Time
					</button>
				</div>
			</div>
			
			{#if metrics.progressOverTime.length > 0}
				<canvas bind:this={chartCanvas} class="progress-chart"></canvas>
			{:else}
				<div class="empty-state">
					<p>No progress data available yet. Complete some papers to see your progress!</p>
				</div>
			{/if}
		</div>

	{:else if selectedView === 'detailed'}
		<!-- Detailed Paper List -->
		<div class="detailed-section">
			<div class="section-header">
				<h3>Detailed Performance</h3>
				<button class="export-button" onclick={exportPerformanceData}>
					Export Data
				</button>
			</div>
			
			<div class="papers-table">
				<div class="table-header">
					<div class="col-subject">Subject</div>
					<div class="col-paper">Paper</div>
					<div class="col-score">Score</div>
					<div class="col-percentage">Percentage</div>
					<div class="col-grade">Grade</div>
					<div class="col-status">Status</div>
				</div>
				
				{#each performanceData.filter(p => p.stats.answeredQuestions > 0) as paperData}
					<div class="table-row">
						<div class="col-subject">{paperData.paper.subject}</div>
						<div class="col-paper">
							{paperData.paper.board} {paperData.paper.year} {paperData.paper.session} {paperData.paper.variant}
						</div>
						<div class="col-score">
							{paperData.stats.totalMarks} / {paperData.stats.maxMarks}
						</div>
						<div class="col-percentage">
							{formatPercentage(paperData.stats.percentage)}%
						</div>
						<div class="col-grade grade-{paperData.stats.grade.toLowerCase().replace('*', 'star')}">
							{paperData.stats.grade}
						</div>
						<div class="col-status">
							<span class="status-badge" class:completed={paperData.isCompleted}>
								{paperData.isCompleted ? 'Completed' : 'In Progress'}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.performance-tracker {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.view-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 1rem;
	}

	.view-button {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.view-button:hover {
		background: #f8fafc;
	}

	.view-button.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}

	.stat-subtitle {
		font-size: 0.875rem;
		color: #64748b;
	}

	.chart-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.chart-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.grade-chart, .progress-chart {
		width: 100%;
		height: 300px;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
	}

	.subjects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.subject-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.subject-card h4 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.subject-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.subject-stat {
		display: flex;
		justify-content: space-between;
	}

	.subject-stat .label {
		color: #64748b;
		font-size: 0.875rem;
	}

	.subject-stat .value {
		font-weight: 600;
	}

	.subject-progress {
		height: 8px;
		background: #f1f5f9;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: #3b82f6;
		transition: width 0.3s ease;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.time-range-selector {
		display: flex;
		gap: 0.25rem;
	}

	.time-button {
		padding: 0.25rem 0.75rem;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.time-button:hover {
		background: #f8fafc;
	}

	.time-button.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.export-button {
		padding: 0.5rem 1rem;
		background: #059669;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.export-button:hover {
		background: #047857;
	}

	.papers-table {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.table-header, .table-row {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr 1fr 0.5fr 1fr;
		gap: 1rem;
		padding: 1rem;
		align-items: center;
	}

	.table-header {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-row {
		border-top: 1px solid #f1f5f9;
	}

	.table-row:hover {
		background: #f8fafc;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.completed {
		background: #d1fae5;
		color: #065f46;
	}

	/* Grade colors */
	.grade-astar { color: #059669; }
	.grade-a { color: #0891b2; }
	.grade-b { color: #7c3aed; }
	.grade-c { color: #ea580c; }
	.grade-d { color: #dc2626; }
	.grade-e { color: #be123c; }
	.grade-f { color: #991b1b; }
	.grade-u { color: #6b7280; }

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr 1fr;
		}
		
		.subjects-grid {
			grid-template-columns: 1fr;
		}
		
		.table-header, .table-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		
		.table-header > div, .table-row > div {
			padding: 0.25rem 0;
		}
		
		.progress-header {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>