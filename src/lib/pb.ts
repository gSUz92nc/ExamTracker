import PocketBase from 'pocketbase';
import {
	CF_ACCESS_CLIENT_SECRET,
	CF_ACCESS_CLIENT_ID,
	PB_EMAIL,
	PB_PASSWORD
} from '$env/static/private';

// Create a factory function to get a fresh PocketBase instance for each request
export async function getPocketBaseClient(authenticate = true) {
	const pb = new PocketBase('https://pocketbase-cs0kgg4044kg80ws4sggws44.a1dn.dev');
	
	// Add Cloudflare Access headers before any request is sent
	pb.beforeSend = function (url, options) {
		// Initialize headers if they don't exist
		options.headers = options.headers || {};

		// Add Cloudflare Access headers
		options.headers['CF-Access-Client-Id'] = CF_ACCESS_CLIENT_ID;
		options.headers['CF-Access-Client-Secret'] = CF_ACCESS_CLIENT_SECRET;

		return { url, options };
	};
	
	// Authenticate if required
	if (authenticate) {
		try {
			await pb.collection('_superusers').authWithPassword(PB_EMAIL, PB_PASSWORD);
		} catch (error) {
			console.error('Failed to authenticate with PocketBase:', error);
			// Continue even if authentication fails
		}
	}
	
	return pb;
}

// For backward compatibility with existing code
// Note: This is synchronous and won't include authentication
export const pb = (() => {
	console.warn('Using the global PocketBase instance is deprecated in Cloudflare Workers. Use getPocketBaseClient() instead.');
	return getPocketBaseClient(false);
})();
