import { pb } from '$lib/pb';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('user_id');
	const paperId = url.searchParams.get('paper_id');

	if (!userId || !paperId) {
		return json({ error: 'Missing required parameters' }, { status: 400 });
	}

	try {
		// Fetch data using Pocketbase
		const data = await pb.collection('scores').getFullList({
			filter: `user_id="${userId}" && paper_id="${paperId}"`
		});

		console.log('Fetched data:', data); // Debugging line

		return json(data);
	} catch (error) {
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 500 });
		}
		return json({ error: 'An unknown error occurred' }, { status: 500 });
	}
}

export async function POST({ request }: RequestEvent) {
	try {
		// Get data from request body
		const body = await request.json();
		
		// Validate required fields
		const { user_id, question_id, score, paper_id } = body;
		if (!user_id || !paper_id || !score) {
			return json({ error: 'Missing required fields: user_id, paper_id, and score are required' }, { status: 400 });
		}
		
		// Create record in PocketBase
		const data = await pb.collection('scores').create({
			user_id,
			question_id,
			score,
			paper_id,
			updated: new Date().toISOString()
		});
		
		return json(data, { status: 201 });
	} catch (error) {
		if (error instanceof Error) {
			return json({ error: error.message }, { status: 500 });
		}
		return json({ error: 'An unknown error occurred' }, { status: 500 });
	}
}
