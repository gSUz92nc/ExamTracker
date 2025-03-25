import PocketBase from 'pocketbase';
import {
	CF_ACCESS_CLIENT_SECRET,
	CF_ACCESS_CLIENT_ID,
	PB_EMAIL,
	PB_PASSWORD
} from '$env/static/private';

export const pb = new PocketBase('https://pocketbase-cs0kgg4044kg80ws4sggws44.a1dn.dev');

await pb.collection('_superusers').authWithPassword(PB_EMAIL, PB_PASSWORD);

pb.beforeSend = function (url, options) {
	// Initialize headers if they don't exist
	options.headers = options.headers || {};

	// Add Cloudflare Access headers
	options.headers['CF-Access-Client-Id'] = CF_ACCESS_CLIENT_ID;
	options.headers['CF-Access-Client-Secret'] = CF_ACCESS_CLIENT_SECRET;

	return { url, options };
};
