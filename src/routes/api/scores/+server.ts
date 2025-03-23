import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	try {
		const id = url.searchParams.get('id');
		
		// Get all scores if no ID is specified
		if (!id) {
			const scores = await platform.env.DB.prepare('SELECT * FROM scores').all();
			return json(scores.results);
		}
		
		// Get a specific score by ID
		const score = await platform.env.DB.prepare('SELECT * FROM scores WHERE id = ?').bind(id).first();
		
		if (!score) {
			return json({ id, score: 0 });
		}
		
		return json(score);
	} catch (err) {
		console.error('Error fetching score:', err);
		throw error(500, 'Failed to fetch score');
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { id, score } = await request.json();
		
		if (!id) {
			throw error(400, 'ID is required');
		}
		
		// Upsert the score
		await platform.env.DB.prepare(
			'INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET score = ?'
		).bind(id, score || 0, score || 0).run();
		
		return json({ success: true, id, score });
	} catch (err) {
		console.error('Error updating score:', err);
		throw error(500, 'Failed to update score');
	}
};