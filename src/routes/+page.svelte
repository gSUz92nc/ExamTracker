<script lang="ts">

  // State variables
  let searchQuery = '';
  let selectedSubject = $state(null);
  let selectedBoard = $state(null);
  let selectedPaper = $state(null);
  let activeTab = 'papers'; // 'papers', 'performance', 'settings'
  
  // Available subjects
  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology' },
    { id: 'cs', name: 'Computer Science' }
  ];
  
  // Exam boards
  const examBoards = [
    { id: 'aqa', name: 'AQA' },
    { id: 'ocr', name: 'OCR' },
    { id: 'edexcel', name: 'Edexcel' },
    { id: 'cie', name: 'Cambridge (CIE)' },
    { id: 'wjec', name: 'WJEC' }
  ];
  
  // Past papers data (simulated)
  const pastPapers = [
    { id: 1, subject: 'chemistry', board: 'ocr', year: 2023, season: 'Summer', paper: 'Paper 1', totalMarks: 75 },
    { id: 2, subject: 'chemistry', board: 'ocr', year: 2023, season: 'Summer', paper: 'Paper 2', totalMarks: 85 },
    { id: 3, subject: 'chemistry', board: 'ocr', year: 2022, season: 'Winter', paper: 'Paper 1', totalMarks: 75 },
    { id: 4, subject: 'chemistry', board: 'ocr', year: 2022, season: 'Summer', paper: 'Paper 1', totalMarks: 75 },
    { id: 5, subject: 'chemistry', board: 'ocr', year: 2022, season: 'Summer', paper: 'Paper 2', totalMarks: 85 },
    { id: 6, subject: 'chemistry', board: 'ocr', year: 2021, season: 'Summer', paper: 'Paper 1', totalMarks: 75 }
  ];
  
  // Questions for selected paper (simulated)
  let questions = $state([]);
  
  // User's marks for questions (simulated)
  let userMarks = $state({});
  
  let filteredPapers = $derived(pastPapers.filter(paper => {
      const matchesSubject = !selectedSubject || paper.subject === selectedSubject;
      const matchesBoard = !selectedBoard || paper.board === selectedBoard;
      const matchesSearch = !searchQuery || 
        `${paper.year} ${paper.season} ${paper.paper}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSubject && matchesBoard && matchesSearch
    }));

  
  // Group papers by year and season
  let groupedPapers = $derived(filteredPapers.reduce((groups: any, paper) => {
    const key = `${paper.year} ${paper.season}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(paper);
    return groups;``
  }, {}));
  
  // Calculate total score for selected paper
  let totalScore = $derived(selectedPaper ? 
    questions.reduce((sum, q) => sum + (userMarks[`${selectedPaper.id}-${q.number}`] || 0), 0) : 0);
  
  // Calculate percentage score
  let percentageScore = $derived(selectedPaper && selectedPaper.totalMarks > 0 ? 
    Math.round((totalScore / selectedPaper.totalMarks) * 100) : 0);
  
  // Select a subject
  function selectSubject(id) {
    selectedSubject = id;
    selectedPaper = null;
  }
  
  // Select an exam board
  function selectBoard(id) {
    selectedBoard = id;
    selectedPaper = null;
  }
  
  // Select a paper
  function selectPaper(paper) {
    selectedPaper = paper;
    loadQuestions(paper);
  }
  
  // Load questions for selected paper
  function loadQuestions(paper) {
    // In a real app, this would fetch from an API
    // Simulating questions for the selected paper
    const questionCount = Math.floor(Math.random() * 10) + 10; // 10-20 questions
    questions = Array.from({ length: questionCount }, (_, i) => {
      const number = i + 1;
      const marks = Math.floor(Math.random() * 8) + 1; // 1-8 marks per question
      
      // Initialize user marks if not already set
      if (!userMarks[`${paper.id}-${number}`]) {
        userMarks[`${paper.id}-${number}`] = 0;
      }
      
      return { number, marks };
    });
  }
  
  // Update mark for a question
  function updateMark(questionNumber, mark) {
    if (selectedPaper) {
      const key = `${selectedPaper.id}-${questionNumber}`;
      userMarks[key] = parseInt(mark) || 0;
      userMarks = userMarks; // Trigger reactivity
    }
  }
  
  // Save all marks for current paper
  function saveMarks() {
    // In a real app, this would save to a database
    console.log('Saving marks for paper:', selectedPaper.id);
    console.log('Marks:', userMarks);
    
    // Show success message
    alert('Your marks have been saved successfully!');
  }
  
  // Reset marks for current paper
  function resetMarks() {
    if (selectedPaper) {
      questions.forEach(q => {
        userMarks[`${selectedPaper.id}-${q.number}`] = 0;
      });
      userMarks = userMarks; // Trigger reactivity
    }
  }
  
  // Switch between tabs
  function setActiveTab(tab) {
    activeTab = tab;
  }
  
  // Get paper score data
  function getPaperScoreData(paperId) {
    const paper = pastPapers.find(p => p.id === paperId);
    if (!paper) return { score: 0, percentage: 0 };
    
    // Find questions for this paper
    const paperQuestions = questions.filter(q => q.paperId === paperId);
    if (paperQuestions.length === 0) return { score: 0, percentage: 0 };
    
    // Calculate score
    const score = paperQuestions.reduce((sum, q) => sum + (userMarks[`${paperId}-${q.number}`] || 0), 0);
    const percentage = Math.round((score / paper.totalMarks) * 100);
    
    return { score, percentage };
  }
  
  // Get weak papers (papers with score < 60%)
  let weakPapers = $derived(pastPapers.filter(paper => {
    const { percentage } = getPaperScoreData(paper.id);
    return percentage > 0 && percentage < 60;
  }));
</script>

<div class="terminal-container">
  <header class="terminal-header">
    <h1>ExamTracker<span class="cursor">_</span></h1>
    <p class="subtitle">Track your exam performance, focus on what matters</p>
  </header>
  
  <nav class="terminal-nav">
    <ul>
      <li><a href="#" class:active={activeTab === 'papers'} on:click|preventDefault={() => setActiveTab('papers')}>Papers</a></li>
      <li><a href="#" class:active={activeTab === 'performance'} on:click|preventDefault={() => setActiveTab('performance')}>Performance</a></li>
      <li><a href="#" class:active={activeTab === 'settings'} on:click|preventDefault={() => setActiveTab('settings')}>Settings</a></li>
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
                {#each subjects as subject}
                  <button 
                    class="option" 
                    class:selected={selectedSubject === subject.id}
                    on:click={() => selectSubject(subject.id)}
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
                  {#each examBoards as board}
                    <button 
                      class="option" 
                      class:selected={selectedBoard === board.id}
                      on:click={() => selectBoard(board.id)}
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
                  <span class="board-name">{examBoards.find(b => b.id === selectedBoard).name}</span> 
                  <span class="subject-name">{subjects.find(s => s.id === selectedSubject).name}</span> 
                  Past Papers
                </div>
                
                {#if Object.keys(groupedPapers).length === 0}
                  <div class="no-results">No papers found. Try different search criteria.</div>
                {:else}
                  {#each Object.entries(groupedPapers) as [group, papers]}
                    <div class="paper-group">
                      <div class="group-title">{group}</div>
                      <ul class="paper-items">
                        {#each papers as paper}
                          <li 
                            class="paper-item" 
                            class:selected={selectedPaper && selectedPaper.id === paper.id}
                            on:click={() => selectPaper(paper)}
                          >
                            <span class="paper-icon">📝</span>
                            <span class="paper-name">{paper.paper}</span>
                            <span class="paper-marks">{paper.totalMarks} marks</span>
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
              <button class="back-button" on:click={() => selectedPaper = null}>← Back to papers</button>
              
              <div class="papers-list compact">
                <div class="list-header">
                  <span class="board-name">{examBoards.find(b => b.id === selectedBoard).name}</span> 
                  <span class="subject-name">{subjects.find(s => s.id === selectedSubject).name}</span> 
                </div>
                
                {#each Object.entries(groupedPapers) as [group, papers]}
                  <div class="paper-group">
                    <div class="group-title">{group}</div>
                    <ul class="paper-items">
                      {#each papers as paper}
                        <li 
                          class="paper-item" 
                          class:selected={selectedPaper && selectedPaper.id === paper.id}
                          on:click={() => selectPaper(paper)}
                        >
                          <span class="paper-name">{paper.paper}</span>
                          <span class="paper-marks">{paper.totalMarks} marks</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/each}
              </div>
            </div>
            
            <div class="paper-detail">
              <div class="paper-header">
                <h2>{selectedPaper.year} {selectedPaper.season} - {selectedPaper.paper}</h2>
                <div class="paper-score-display">
                  <div class="score-display">
                    <span class="score-value">{totalScore}/{selectedPaper.totalMarks}</span>
                    <span class="score-percentage" class:low-score={percentageScore < 60}>
                      {percentageScore}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="paper-score-actions">
                <button class="action-button save" on:click={saveMarks}>Save Score</button>
                <button class="action-button reset" on:click={resetMarks}>Reset</button>
              </div>
              
              <div class="paper-analysis">
                <div class="analysis-message" class:weak={percentageScore < 60} class:strong={percentageScore >= 60}>
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
                
                {#each questions as question}
                  <div class="question-row">
                    <span class="col question-num">{question.number}</span>
                    <span class="col question-marks">{question.marks}</span>
                    <span class="col question-your-mark">
                      <div class="mark-buttons">
                        {#each Array(question.marks + 1) as _, i}
                          <button 
                            class="mark-button" 
                            class:selected={userMarks[`${selectedPaper.id}-${question.number}`] === i}
                            on:click={() => updateMark(question.number, i)}
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
              <div class="stat-value">{pastPapers.filter(p => getPaperScoreData(p.id).percentage > 0).length}</div>
              <div class="stat-label">Papers Attempted</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">
                {Math.round(pastPapers
                  .filter(p => getPaperScoreData(p.id).percentage > 0)
                  .reduce((sum, p) => sum + getPaperScoreData(p.id).percentage, 0) / 
                  Math.max(1, pastPapers.filter(p => getPaperScoreData(p.id).percentage > 0).length)) || 0}%
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
              {#each weakPapers as paper}
                <li class="weak-paper-item">
                  <div class="weak-paper-info">
                    <span class="weak-paper-name">{paper.board.toUpperCase()} {paper.year} {paper.season} - {paper.paper}</span>
                    <span class="weak-paper-score">{getPaperScoreData(paper.id).percentage}%</span>
                  </div>
                  <div class="weak-paper-bar">
                    <div class="weak-paper-progress" style="width: {getPaperScoreData(paper.id).percentage}%"></div>
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
          <h3>Display Options</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" checked> 
              Dark mode
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Data Management</h3>
          <button class="action-button">Export your data</button>
          <button class="action-button reset">Clear all saved scores</button>
        </div>
      </div>
    {/if}
  </main>
  
  <footer class="terminal-footer">
    <p>© {new Date().getFullYear()} ExamTracker | Track your exam performance, focus on what matters</p>
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
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
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
  
  .terminal-nav a {
    display: block;
    padding: 12px 0;
    color: #aaa;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  
  .terminal-nav a:hover, .terminal-nav a.active {
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
  
  .board-name, .subject-name {
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
  
  .paper-items {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  
  .paper-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px dashed #333;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .paper-item:hover {
    background-color: #2a2a2a;
  }
  
  .paper-item.selected {
    background-color: #2a539e;
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
  }
  
  .paper-detail {
    background-color: #252525;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 20px;
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
  
  .action-button.save {
    background-color: #2a9e53;
  }
  
  .action-button.save:hover {
    background-color: #3ad16f;
  }
  
  .action-button.reset {
    background-color: #9e2a2a;
  }
  
  .action-button.reset:hover {
    background-color: #d13a3a;
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
  
  .setting-item {
    margin-bottom: 10px;
  }
  
  .setting-item label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  
  .terminal-footer {
    background-color: #252525;
    padding: 15px 20px;
    text-align: center;
    border-top: 1px solid #333;
    color: #aaa;
    font-size: 0.9rem;
  }
</style>