// D1 Database client utilities

/**
 * Get a score by ID
 * @param id The unique identifier for the score
 */
export async function getScore(id: string): Promise<{ id: string; score: number }> {
	const response = await fetch(`/api/scores?id=${encodeURIComponent(id)}`);
	if (!response.ok) {
		throw new Error('Failed to fetch score');
	}
	return response.json();
}

/**
 * Get all scores from the database
 */
export async function getAllScores(): Promise<{ id: string; score: number }[]> {
	const response = await fetch('/api/scores');
	if (!response.ok) {
		throw new Error('Failed to fetch scores');
	}
	return response.json();
}

/**
 * Save a score to the database
 * @param id The unique identifier for the score
 * @param score The score value
 */
export async function saveScore(id: string, score: number): Promise<{ success: boolean }> {
	const response = await fetch('/api/scores', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id, score })
	});
	
	if (!response.ok) {
		throw new Error('Failed to save score');
	}
	
	return response.json();
}