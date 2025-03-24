<script lang="ts">
	import { pastPapers } from '$lib/pastPapers';

	import type { Paper, Question } from '$lib/pastPapers';

	// Define all types/interfaces
	interface Subject {
		id: string;
		name: string;
	}

	interface ExamBoard {
		id: string;
		name: string;
	}

	interface UserMarks {
		[key: string]: number;
	}

	interface PaperScoreData {
		score: number;
		percentage: number;
	}

	interface GroupedPapers {
		[key: string]: Paper[];
	}

	// Local storage data structure
	interface StoredData {
		userMarks: UserMarks;
		lastUpdated: string;
	}

	// Storage key for localStorage
	const STORAGE_KEY = 'examtracker_data';

	// State variables
	let searchQuery = $state<string>('');
	let selectedSubject = $state<string | null>(null);
	let selectedBoard = $state<string | null>(null);
	let selectedPaper = $state<Paper | null>(null);
	let activeTab = $state<'papers' | 'performance' | 'settings'>('papers');
	let exportedData = $state<string>('');
	let showExportedData = $state<boolean>(false);

	// Available subjects
	const subjects: Subject[] = [
		{ id: 'cs', name: 'Computer Science' },
		{ id: 'maths', name: 'Mathematics' },
		{ id: 'physics', name: 'Physics' },
		{ id: 'chemistry', name: 'Chemistry' },
		{ id: 'biology', name: 'Biology' },
		{ id: 'english', name: 'English' },
		{ id: 'history', name: 'History' },
		{ id: 'geography', name: 'Geography' }
	];

	// Exam boards
	const examBoards: ExamBoard[] = [
		{ id: 'ocr', name: 'OCR' },
		{ id: 'edexcel', name: 'Edexcel' },
		{ id: 'aqa', name: 'AQA' },
		{ id: 'ccea', name: 'CCEA' },
		{ id: 'wjec', name: 'WJEC' },
		{ id: 'ib', name: 'IB' },
		{ id: 'cambridge', name: 'Cambridge' }
	];

	// Questions for selected paper (simulated)
	let questions = $state<Question[]>([]);

	// User's marks for questions (simulated)
	let userMarks = $state<UserMarks>({});

	// Load data from localStorage on component initialization
	const loadFromLocalStorage = () => {
		if (typeof window !== 'undefined') {
			try {
				const storedData = localStorage.getItem(STORAGE_KEY);
				if (storedData) {
					const parsedData: StoredData = JSON.parse(storedData);
					userMarks = parsedData.userMarks;
					console.log('Data loaded from localStorage', parsedData.lastUpdated);
				}
			} catch (error) {
				console.error('Failed to load data from localStorage:', error);
			}
		}
	};

	// Save data to localStorage
	const saveToLocalStorage = () => {
		if (typeof window !== 'undefined') {
			try {
				const data: StoredData = {
					userMarks,
					lastUpdated: new Date().toISOString()
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
				console.log('Data saved to localStorage');
			} catch (error) {
				console.error('Failed to save data to localStorage:', error);
			}
		}
	};

	// Export all data as JSON
	const exportData = () => {
		const data: StoredData = {
			userMarks,
			lastUpdated: new Date().toISOString()
		};
		exportedData = JSON.stringify(data, null, 2);
		showExportedData = true;
	};

	// Clear all saved data
	const clearAllData = () => {
		if (
			typeof window !== 'undefined' &&
			confirm('Are you sure you want to clear all saved scores? This cannot be undone.')
		) {
			localStorage.removeItem(STORAGE_KEY);
			userMarks = {};
			alert('All scores have been cleared.');
		}
	};

	// Load data on component initialization (browser-only)
	if (typeof window !== 'undefined') {
		loadFromLocalStorage();
	}

	let filteredPapers = $derived(
		pastPapers.filter((paper) => {
			const matchesSubject = !selectedSubject || paper.subject === selectedSubject;
			const matchesBoard = !selectedBoard || paper.board === selectedBoard;
			const matchesSearch =
				!searchQuery ||
				`${paper.year} ${paper.season} ${paper.paper}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());

			return matchesSubject && matchesBoard && matchesSearch;
		})
	);

	// Group papers by year and season
	let groupedPapers = $derived<GroupedPapers>(
		filteredPapers.reduce((groups: GroupedPapers, paper) => {
			const key = `${paper.year} ${paper.season}`;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(paper);
			return groups;
		}, {})
	);

	// Calculate total score for selected paper - with null safety
	let totalScore = $derived<number>(
		selectedPaper
			? questions.reduce((sum, q) => {
					const key = `${selectedPaper?.id}-${q.id}`;
					return sum + (userMarks[key] || 0);
				}, 0)
			: 0
	);

	// Calculate percentage score
	let percentageScore = $derived<number>(
		selectedPaper
			? (function () {
					// Calculate total marks available for the paper based on its questions
					const totalMarksAvailable = calculateTotalMarks(selectedPaper);
					if (totalMarksAvailable === 0) return 0;
					return Math.round((totalScore / totalMarksAvailable) * 100);
				})()
			: 0
	);

	// Select a subject
	function selectSubject(id: string): void {
		selectedSubject = id;
		selectedPaper = null;
	}

	// Select an exam board
	function selectBoard(id: string): void {
		selectedBoard = id;
		selectedPaper = null;
	}

	// Select a paper
	function selectPaper(paper: Paper): void {
		selectedPaper = paper;
		loadQuestions(paper);
	}

	// Load questions for selected paper
	function loadQuestions(paper: Paper): void {
		// Use the questions from the paper object instead of generating them
		questions = paper.questions;

		// Initialize user marks for each question if not already set
		paper.questions.forEach((q) => {
			const key = `${paper.id}-${q.id}`;
			if (!userMarks[key]) {
				userMarks[key] = 0;
			}
		});
	}

	// Update mark for a question
	function updateMark(questionId: string, mark: number): void {
		if (selectedPaper) {
			const key = `${selectedPaper.id}-${questionId}`;
			userMarks[key] = parseInt(mark.toString()) || 0;
			userMarks = userMarks; // Trigger reactivity

			// Save automatically when marks are updated
			saveToLocalStorage();
		}
	}

	// Reset marks for current paper
	function resetMarks(): void {
		if (selectedPaper) {
			questions.forEach((q) => {
				const key = `${selectedPaper!.id}-${q.id}`;
				userMarks[key] = 0;
			});
			userMarks = userMarks; // Trigger reactivity

			// Save changes to localStorage
			saveToLocalStorage();
		}
	}

	// Switch between tabs
	function setActiveTab(tab: 'papers' | 'performance' | 'settings'): void {
		activeTab = tab;
		showExportedData = false; // Hide export data when switching tabs
	}

	// Get paper score data
	function getPaperScoreData(paperId: number): PaperScoreData {
		const paper = pastPapers.find((p) => p.id === paperId);
		if (!paper) return { score: 0, percentage: 0 };

		// Calculate total score for this paper
		let score = 0;
		const totalMarks = calculateTotalMarks(paper);

		// Sum up the user's marks for each question in this paper
		paper.questions.forEach((q) => {
			const key = `${paperId}-${q.id}`;
			score += userMarks[key] || 0;
		});

		// Calculate percentage
		const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

		return { score, percentage };
	}

	// Get weak papers (papers with score < 60%)
	let weakPapers = $derived<Paper[]>(
		pastPapers.filter((paper) => {
			const { percentage } = getPaperScoreData(paper.id);
			return percentage > 0 && percentage < 60;
		})
	);

	// Helper function to safely find subject/board name
	function findSubjectName(id: string | null): string {
		if (!id) return '';
		const subject = subjects.find((s) => s.id === id);
		return subject ? subject.name : '';
	}

	function findBoardName(id: string | null): string {
		if (!id) return '';
		const board = examBoards.find((b) => b.id === id);
		return board ? board.name : '';
	}

	// Calculate total marks for a paper based on its questions
	function calculateTotalMarks(paper: Paper): number {
		return paper.questions.reduce((sum, q) => sum + q.marks, 0);
	}
</script>

<svelte:head>
	<title>ExamTracker</title>
</svelte:head>

<div class="terminal-container">
	<header class="terminal-header">
		<h1>ExamTracker<span class="cursor">_</span></h1>
		<p class="subtitle">Track your past paper performance and progress</p>
	</header>

	<nav class="terminal-nav">
		<ul>
			<li>
				<button
					class="nav-link"
					class:active={activeTab === 'papers'}
					onclick={() => setActiveTab('papers')}>Papers</button
				>
			</li>
			<li>
				<button
					class="nav-link"
					class:active={activeTab === 'performance'}
					onclick={() => setActiveTab('performance')}>Performance</button
				>
			</li>
			<li>
				<button
					class="nav-link"
					class:active={activeTab === 'settings'}
					onclick={() => setActiveTab('settings')}>Settings</button
				>
			</li>
		</ul>
	</nav>

	<main class="terminal-content">
		{#if activeTab === 'papers'}
			<div class="papers-tab">
				{#if !selectedPaper}
					<!-- Full width papers selection when no paper is selected -->
					<div class="full-width-selection">
						<div class="section">
							<div class="section-title">Choose a subject:</div>
							<div class="options">
								{#each subjects as subject (subject.id)}
									<button
										class="option"
										class:selected={selectedSubject === subject.id}
										onclick={() => selectSubject(subject.id)}
									>
										{subject.name}
									</button>
								{/each}
							</div>
						</div>

						{#if selectedSubject}
							<div class="section">
								<div class="section-title">Choose an exam board:</div>
								<div class="options">
									{#each examBoards as board (board.id)}
										<button
											class="option"
											class:selected={selectedBoard === board.id}
											onclick={() => selectBoard(board.id)}
										>
											{board.name}
										</button>
									{/each}
								</div>
							</div>
						{/if}

						{#if selectedSubject && selectedBoard}
							<div class="section">
								<div class="section-title">Search papers:</div>
								<input
									type="text"
									bind:value={searchQuery}
									placeholder="Type to search..."
									class="search-input"
								/>
							</div>

							<div class="papers-list">
								<div class="list-header">
									<span class="board-name">{findBoardName(selectedBoard)}</span>
									<span class="subject-name">{findSubjectName(selectedSubject)}</span>
									Past Papers
								</div>

								{#if Object.keys(groupedPapers).length === 0}
									<div class="no-results">No papers found. Try different search criteria.</div>
								{:else}
									{#each Object.entries(groupedPapers) as [group, papers] (group)}
										<div class="paper-group">
											<div class="group-title">{group}</div>
											<ul class="paper-items">
												{#each papers as paper (paper.id)}
													<li>
														<button
															class="paper-item"
															onclick={() => selectPaper(paper)}
															onkeydown={(e) => e.key === 'Enter' && selectPaper(paper)}
														>
															<span class="paper-icon">📝{paper.paper}</span>
															<span class="paper-marks">{calculateTotalMarks(paper)} marks</span>
														</button>
													</li>
												{/each}
											</ul>
										</div>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<!-- Split view when paper is selected -->
					<div class="split-view">
						<div class="paper-list-sidebar">
							<button class="back-button" onclick={() => (selectedPaper = null)}
								>← Back to papers</button
							>

							<div class="papers-list compact">
								<div class="list-header">
									<span class="board-name">{findBoardName(selectedBoard)}</span>
									<span class="subject-name">{findSubjectName(selectedSubject)}</span>
								</div>

								{#each Object.entries(groupedPapers) as [group, papers] (group)}
									<div class="paper-group">
										<div class="group-title">{group}</div>
										<ul class="paper-items">
											{#each papers as paper (paper.id)}
												<li>
													<button
														class="paper-item"
														class:selected={selectedPaper !== null && selectedPaper.id === paper.id}
														onclick={() => selectPaper(paper)}
														onkeydown={(e) => e.key === 'Enter' && selectPaper(paper)}
													>
														<span class="paper-name">{paper.paper}</span>
														<span class="paper-marks">{calculateTotalMarks(paper)} marks</span>
													</button>
												</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						</div>

						<div class="paper-detail">
							<div class="paper-header">
								<div>
									<h2>{selectedPaper.year} {selectedPaper.season} - {selectedPaper.paper}</h2>
								</div>
								<div class="paper-score-display">
									<div class="score-display">
										<span class="score-value"
											>{totalScore}/{calculateTotalMarks(selectedPaper)}</span
										>
										<span class="score-percentage" class:low-score={percentageScore < 60}>
											{percentageScore}%
										</span>
									</div>
								</div>
							</div>

							<div class="paper-score-actions">
								{#if selectedPaper.extraResources}
									{#each selectedPaper.extraResources as resource (resource)}
										<button
											class="open-paper-button"
											onclick={() => window.open(resource.url, '_blank')}
										>
											<span class="open-paper-icon">📄</span> Open {resource.type}
										</button>
									{/each}
								{/if}
								{#if selectedPaper.url}
									<button
										class="open-paper-button"
										onclick={() => window.open(selectedPaper?.url, '_blank')}
									>
										<span class="open-paper-icon">📄</span> Open Paper
									</button>
								{/if}
								{#if selectedPaper.markschemeUrl}
									<button
										class="open-paper-button open-markscheme-button"
										onclick={() => window.open(selectedPaper?.markschemeUrl, '_blank')}
									>
										<span class="open-paper-icon">📋</span> Open Markscheme
									</button>
								{/if}
								<button class="action-button reset" onclick={resetMarks}>Reset</button>
							</div>

							<div class="paper-analysis">
								<div
									class="analysis-message"
									class:weak={percentageScore < 60}
									class:strong={percentageScore >= 60}
								>
									<p>
										{#if percentageScore < 60}
											You need to focus more on this paper. Keep practicing!
										{:else}
											You're doing well on this paper! Keep up the good work.
										{/if}
									</p>
								</div>
							</div>

							<div class="questions-list">
								<div class="questions-header">
									<span class="col question-num">Q#</span>
									<span class="col question-marks">Max</span>
									<span class="col question-your-mark">Your Mark</span>
								</div>

								{#each questions as question (question.id)}
									<div class="question-row">
										<span class="col question-num">{question.id}</span>
										<span class="col question-marks">{question.marks}</span>
										<span class="col question-your-mark">
											<div class="mark-buttons">
												{#each Array(question.marks + 1) as _, i (i)}
													<button
														class="mark-button"
														class:selected={userMarks[`${selectedPaper.id}-${question.id}`] === i}
														onclick={() => updateMark(question.id, i)}
													>
														{i}
													</button>
												{/each}
											</div>
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'performance'}
			<div class="performance-tab">
				<div class="performance-overview">
					<h2>Performance Overview</h2>

					<div class="performance-stats">
						<div class="stat-card">
							<div class="stat-value">
								{pastPapers.filter((p) => getPaperScoreData(p.id).percentage > 0).length}
							</div>
							<div class="stat-label">Papers Attempted</div>
						</div>

						<div class="stat-card">
							<div class="stat-value">
								{Math.round(
									pastPapers
										.filter((p) => getPaperScoreData(p.id).percentage > 0)
										.reduce((sum, p) => sum + getPaperScoreData(p.id).percentage, 0) /
										Math.max(
											1,
											pastPapers.filter((p) => getPaperScoreData(p.id).percentage > 0).length
										)
								) || 0}%
							</div>
							<div class="stat-label">Average Score</div>
						</div>

						<div class="stat-card">
							<div class="stat-value">{weakPapers.length}</div>
							<div class="stat-label">Papers Below 60%</div>
						</div>
					</div>
				</div>

				<div class="weak-papers-section">
					<h3>Papers That Need Improvement</h3>

					{#if weakPapers.length === 0}
						<p class="no-weak-papers">No weak papers found. Great job!</p>
					{:else}
						<ul class="weak-papers-list">
							{#each weakPapers as paper (paper.id)}
								<li class="weak-paper-item">
									<div class="weak-paper-info">
										<span class="weak-paper-name"
											>{paper.board.toUpperCase()} {paper.year} {paper.season} - {paper.paper}</span
										>
										<span class="weak-paper-score">{getPaperScoreData(paper.id).percentage}%</span>
									</div>
									<div class="weak-paper-bar">
										<div
											class="weak-paper-progress"
											style="width: {getPaperScoreData(paper.id).percentage}%"
										></div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'settings'}
			<div class="settings-tab">
				<h2>Settings</h2>

				<div class="settings-section">
					<h3>Data Management</h3>
					<div class="settings-actions">
						<button class="action-button" onclick={exportData}>Export your data</button>
						<button class="action-button reset" onclick={clearAllData}
							>Clear all saved scores</button
						>
					</div>

					{#if showExportedData}
						<div class="export-container">
							<h4>Your Exported Data:</h4>
							<pre class="exported-json">{exportedData}</pre>
							<div class="export-actions">
								<button
									class="action-button small"
									onclick={() => {
										navigator.clipboard.writeText(exportedData);
										alert('Data copied to clipboard!');
									}}
								>
									Copy to Clipboard
								</button>
								<button class="action-button small" onclick={() => (showExportedData = false)}>
									Hide Data
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>

	<footer class="terminal-footer">
		<p>
			© {new Date().getFullYear()}
			<a
				href="https://github.com/gSUz92nc/ExamTracker"
				target="_blank"
				rel="noopener noreferrer"
				title="This link will redirect you to GitHub"
			>
				Visit ExamTracker on GitHub
			</a>
		</p>
	</footer>
</div>

<style>
	.terminal-container {
		max-width: 1200px;
		margin: 20px auto;
		background-color: #1e1e1e;
		border-radius: 6px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		font-family: 'Courier New', monospace;
		color: #f0f0f0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 90vh;
	}

	.terminal-header {
		padding: 20px;
		text-align: center;
		border-bottom: 1px solid #333;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
		color: #5af78e;
		letter-spacing: -1px;
	}

	h2 {
		font-size: 1.5rem;
		margin: 0 0 20px 0;
		color: #57c7ff;
	}

	h3 {
		font-size: 1.2rem;
		margin: 0 0 15px 0;
		color: #ff9e64;
	}

	h4 {
		font-size: 1rem;
		margin: 10px 0;
		color: #57c7ff;
	}

	.subtitle {
		color: #aaa;
		margin-top: 5px;
	}

	.cursor {
		color: #5af78e;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	.terminal-nav {
		background-color: #252525;
		padding: 0 20px;
	}

	.terminal-nav ul {
		display: flex;
		list-style: none;
		padding: 0;
		margin: 0;
		overflow-x: auto;
	}

	.terminal-nav li {
		margin-right: 20px;
	}

	.nav-link {
		background: none;
		border: none;
		padding: 12px 0;
		color: #aaa;
		text-decoration: none;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		font-size: 1rem;
	}

	.nav-link:hover,
	.nav-link.active {
		color: #5af78e;
		border-bottom-color: #5af78e;
	}

	.terminal-content {
		padding: 20px;
		flex-grow: 1;
		overflow: auto;
	}

	/* Full width papers selection */
	.full-width-selection {
		width: 100%;
	}

	/* Split view when paper is selected */
	.split-view {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 20px;
		height: 100%;
	}

	@media (max-width: 900px) {
		.split-view {
			grid-template-columns: 1fr;
		}
	}

	.paper-list-sidebar {
		overflow-y: auto;
	}

	.back-button {
		background-color: transparent;
		border: 1px solid #444;
		color: #57c7ff;
		padding: 8px 12px;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		margin-bottom: 15px;
		width: 100%;
		text-align: left;
	}

	.back-button:hover {
		background-color: #252525;
	}

	.section {
		margin-bottom: 20px;
	}

	.section-title {
		color: #57c7ff;
		margin-bottom: 10px;
		font-weight: bold;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 8px;
	}

	.option {
		background-color: transparent;
		border: 1px solid #444;
		color: #ddd;
		padding: 6px 12px;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		transition: all 0.2s;
	}

	.option:hover {
		background-color: #333;
	}

	.option.selected {
		background-color: #2a539e;
		border-color: #3a6fd1;
		color: white;
	}

	.search-input {
		background-color: #252525;
		border: 1px solid #444;
		color: #f0f0f0;
		padding: 8px 12px;
		width: 100%;
		font-family: 'Courier New', monospace;
		border-radius: 4px;
	}

	.papers-list {
		background-color: #252525;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 16px;
		margin-top: 20px;
		max-height: 600px;
		overflow-y: auto;
	}

	.papers-list.compact {
		margin-top: 0;
		max-height: calc(100vh - 200px);
	}

	.list-header {
		font-weight: bold;
		margin-bottom: 16px;
		padding-bottom: 10px;
		border-bottom: 1px solid #444;
		color: #ff9e64;
	}

	.board-name,
	.subject-name {
		color: #5af78e;
	}

	.no-results {
		color: #ff6e67;
		font-style: italic;
		padding: 10px 0;
	}

	.paper-group {
		margin-bottom: 20px;
	}

	.group-title {
		color: #57c7ff;
		margin-bottom: 10px;
		font-weight: bold;
	}

	.paper-item {
		display: flex;
		align-items: center;
		padding: 8px 10px;
		border-bottom: 1px dashed #333;
		cursor: pointer;
		transition: background-color 0.2s;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		color: inherit;
		font-family: inherit;
		font-size: inherit;
		justify-content: space-between;
	}

	.paper-icon {
		margin-right: 12px;
	}

	.paper-name {
		flex-grow: 1;
	}

	.paper-marks {
		color: #aaa;
		font-size: 0.9rem;
		margin-left: auto;
		text-align: right;
	}

	.paper-detail {
		background-color: #252525;
		padding: 20px;
		border: 1px solid #444;
		overflow-y: auto;
	}

	.paper-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 10px;
		border-bottom: 1px solid #444;
	}

	.paper-score-display {
		text-align: right;
	}

	.score-display {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.score-value {
		font-size: 1.2rem;
		font-weight: bold;
	}

	.score-percentage {
		font-size: 1.2rem;
		font-weight: bold;
		color: #5af78e;
	}

	.score-percentage.low-score {
		color: #ff6e67;
	}

	.paper-score-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-bottom: 20px;
	}

	.action-button {
		background-color: #2a539e;
		border: none;
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.action-button:hover {
		background-color: #3a6fd1;
	}

	.action-button.reset {
		background-color: #9e2a2a;
	}

	.action-button.reset:hover {
		background-color: #d13a3a;
	}

	.action-button.small {
		font-size: 0.8rem;
		padding: 4px 8px;
	}

	.paper-analysis {
		margin-bottom: 20px;
	}

	.analysis-message {
		padding: 15px;
		border-radius: 4px;
	}

	.analysis-message.weak {
		background-color: rgba(158, 42, 42, 0.2);
		border-left: 4px solid #9e2a2a;
	}

	.analysis-message.strong {
		background-color: rgba(42, 158, 83, 0.2);
		border-left: 4px solid #2a9e53;
	}

	.questions-list {
		width: 100%;
		margin-top: 20px;
	}

	.questions-header {
		display: grid;
		grid-template-columns: 50px 50px 1fr;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px solid #444;
		font-weight: bold;
		color: #57c7ff;
	}

	.question-row {
		display: grid;
		grid-template-columns: 50px 50px 1fr;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px dashed #333;
		align-items: center;
	}

	.mark-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.mark-button {
		width: 30px;
		height: 30px;
		background-color: #1e1e1e;
		border: 1px solid #444;
		color: #f0f0f0;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mark-button:hover {
		background-color: #333;
	}

	.mark-button.selected {
		background-color: #2a539e;
		border-color: #3a6fd1;
	}

	/* Performance tab styles */
	.performance-tab {
		max-width: 900px;
		margin: 0 auto;
	}

	.performance-overview {
		margin-bottom: 30px;
	}

	.performance-stats {
		display: flex;
		gap: 20px;
		margin-top: 20px;
	}

	@media (max-width: 600px) {
		.performance-stats {
			flex-direction: column;
		}
	}

	.stat-card {
		background-color: #252525;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 20px;
		flex: 1;
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #5af78e;
		margin-bottom: 5px;
	}

	.stat-label {
		color: #aaa;
	}

	.weak-papers-section {
		background-color: #252525;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 20px;
		margin-top: 30px;
	}

	.no-weak-papers {
		color: #5af78e;
		font-style: italic;
	}

	.weak-papers-list {
		list-style-type: none;
		padding: 0;
	}

	.weak-paper-item {
		margin-bottom: 15px;
	}

	.weak-paper-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 5px;
	}

	.weak-paper-name {
		font-weight: bold;
	}

	.weak-paper-score {
		color: #ff6e67;
	}

	.weak-paper-bar {
		height: 8px;
		background-color: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
	}

	.weak-paper-progress {
		height: 100%;
		background-color: #9e2a2a;
	}

	/* Settings tab styles */
	.settings-tab {
		max-width: 800px;
		margin: 0 auto;
	}

	.settings-section {
		background-color: #252525;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.settings-actions {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.export-container {
		margin-top: 20px;
		background-color: #1e1e1e;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 15px;
	}

	.exported-json {
		background-color: #111;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 10px;
		overflow-x: auto;
		max-height: 300px;
		color: #57c7ff;
		font-family: monospace;
		white-space: pre-wrap;
	}

	.export-actions {
		display: flex;
		gap: 10px;
		margin-top: 10px;
		justify-content: flex-end;
	}

	.terminal-footer {
		background-color: #252525;
		padding: 15px 20px;
		text-align: center;
		border-top: 1px solid #333;
		color: #aaa;
		font-size: 0.9rem;
	}

	.open-paper-button {
		background-color: #2a539e;
		border: none;
		color: #f0f0f0;
		padding: 6px 12px;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: background-color 0.2s;
	}

	.open-paper-button:hover {
		background-color: #3a6fd1;
	}

	.open-markscheme-button {
		background-color: #2a7e9e;
	}

	.open-markscheme-button:hover {
		background-color: #3a9ed1;
	}

	.open-paper-icon {
		font-size: 1.1rem;
	}
</style>
