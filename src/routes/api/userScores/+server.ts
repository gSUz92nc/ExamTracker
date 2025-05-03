import { getPocketBaseClient } from '$lib/pb';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * GET endpoint to retrieve all paper scores for a specific user
 * 
 * Required query parameter:
 * - user_id: The ID of the user to fetch scores for
 * 
 * Optional query parameter:
 * - sort: Field to sort results by (default: -updated)
 * 
 * @returns JSON response with an array of all paper scores for the user
 */
export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('user_id');

	if (!userId) {
		return json({ error: 'Missing required parameter: user_id' }, { status: 400 });
	}

	try {
		// Create a new PocketBase instance for this request
		const pb = await getPocketBaseClient(true);
		
		// Fetch all scores for the user across all papers
		const data = await pb.collection('scores').getFullList({
			filter: `user_id="${userId}"`,
			expand: 'paper_id' // Expand the paper_id relation if needed
		});

		return json({
			scores: data,
		});
	} catch (error) {
		console.error('Error fetching user scores:', error);
		
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 500 });
		}
		return json({ error: 'An unknown error occurred' }, { status: 500 });
	}
}