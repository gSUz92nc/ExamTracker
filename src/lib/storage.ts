/**
 * Storage utility for managing localStorage and API interactions
 */

import type { UserMarks } from './utils';

export interface StorageConfig {
	apiUrl?: string;
	timeout?: number;
	retries?: number;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	status?: number;
}

export interface UserScore {
	userId: string;
	paperId: string;
	questionId: number;
	score: number;
	maxScore: number;
	timestamp: string;
}

export interface BulkScoreUpdate {
	userId: string;
	paperId: string;
	scores: Array<{
		questionId: number;
		score: number;
		maxScore: number;
	}>;
}

export class StorageManager {
	private config: StorageConfig;
	private readonly STORAGE_KEYS = {
		USER_ID: 'examtracker_user_id',
		USER_MARKS: 'examtracker_user_marks',
		SETTINGS: 'examtracker_settings',
		CACHE: 'examtracker_cache',
		LAST_SYNC: 'examtracker_last_sync'
	};

	constructor(config: StorageConfig = {}) {
		this.config = {
			timeout: 10000,
			retries: 3,
			...config
		};
	}

	// LocalStorage management
	getUserId(): string | null {
		return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
	}

	setUserId(userId: string): void {
		localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
	}

	removeUserId(): void {
		localStorage.removeItem(this.STORAGE_KEYS.USER_ID);
	}

	getUserMarks(): UserMarks {
		const marks = localStorage.getItem(this.STORAGE_KEYS.USER_MARKS);
		if (!marks) return {};
		
		try {
			return JSON.parse(marks);
		} catch {
			console.warn('Failed to parse user marks from localStorage');
			return {};
		}
	}

	setUserMarks(marks: UserMarks): void {
		localStorage.setItem(this.STORAGE_KEYS.USER_MARKS, JSON.stringify(marks));
	}

	updateUserMark(key: string, score: number): void {
		const marks = this.getUserMarks();
		marks[key] = score;
		this.setUserMarks(marks);
	}

	removeUserMarks(): void {
		localStorage.removeItem(this.STORAGE_KEYS.USER_MARKS);
	}

	getSettings(): Record<string, any> {
		const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
		if (!settings) return {};
		
		try {
			return JSON.parse(settings);
		} catch {
			console.warn('Failed to parse settings from localStorage');
			return {};
		}
	}

	setSetting(key: string, value: any): void {
		const settings = this.getSettings();
		settings[key] = value;
		localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
	}

	getLastSyncTime(): Date | null {
		const timestamp = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
		return timestamp ? new Date(timestamp) : null;
	}

	setLastSyncTime(time: Date = new Date()): void {
		localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, time.toISOString());
	}

	// Cache management
	getCache<T>(key: string): T | null {
		const cache = localStorage.getItem(this.STORAGE_KEYS.CACHE);
		if (!cache) return null;
		
		try {
			const cacheData = JSON.parse(cache);
			const item = cacheData[key];
			
			if (!item) return null;
			
			// Check if cache item has expired
			if (item.expires && new Date() > new Date(item.expires)) {
				this.removeFromCache(key);
				return null;
			}
			
			return item.data;
		} catch {
			return null;
		}
	}

	setCache<T>(key: string, data: T, expiresInMs?: number): void {
		const cache = this.getSettings();
		const cacheData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CACHE) || '{}');
		
		cacheData[key] = {
			data,
			timestamp: new Date().toISOString(),
			expires: expiresInMs ? new Date(Date.now() + expiresInMs).toISOString() : null
		};
		
		localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(cacheData));
	}

	removeFromCache(key: string): void {
		const cacheData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CACHE) || '{}');
		delete cacheData[key];
		localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(cacheData));
	}

	clearCache(): void {
		localStorage.removeItem(this.STORAGE_KEYS.CACHE);
	}

	// API methods
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0
	): Promise<ApiResponse<T>> {
		if (!this.config.apiUrl) {
			return { success: false, error: 'API URL not configured' };
		}

		const url = `${this.config.apiUrl}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				}
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return {
					success: false,
					error: `HTTP ${response.status}: ${response.statusText}`,
					status: response.status
				};
			}

			const data = await response.json();
			return { success: true, data, status: response.status };

		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === 'AbortError') {
				return { success: false, error: 'Request timeout' };
			}

			// Retry logic
			if (retryCount < (this.config.retries || 0)) {
				await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
				return this.makeRequest(endpoint, options, retryCount + 1);
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	async saveScore(userId: string, paperId: string, questionId: number, score: number, maxScore: number): Promise<ApiResponse> {
		const scoreData: UserScore = {
			userId,
			paperId,
			questionId,
			score,
			maxScore,
			timestamp: new Date().toISOString()
		};

		return this.makeRequest('/scores', {
			method: 'POST',
			body: JSON.stringify(scoreData)
		});
	}

	async saveBulkScores(bulkUpdate: BulkScoreUpdate): Promise<ApiResponse> {
		return this.makeRequest('/scores/bulk', {
			method: 'POST',
			body: JSON.stringify(bulkUpdate)
		});
	}

	async loadUserScores(userId: string): Promise<ApiResponse<UserScore[]>> {
		return this.makeRequest(`/users/${userId}/scores`);
	}

	async loadPaperScores(userId: string, paperId: string): Promise<ApiResponse<UserScore[]>> {
		return this.makeRequest(`/users/${userId}/papers/${paperId}/scores`);
	}

	async deleteUserData(userId: string): Promise<ApiResponse> {
		return this.makeRequest(`/users/${userId}`, {
			method: 'DELETE'
		});
	}

	async syncWithServer(userId: string): Promise<ApiResponse<{ synced: number; conflicts: number }>> {
		const localMarks = this.getUserMarks();
		const lastSync = this.getLastSyncTime();

		const syncData = {
			userId,
			localMarks,
			lastSync: lastSync?.toISOString(),
			timestamp: new Date().toISOString()
		};

		const result = await this.makeRequest<{ synced: number; conflicts: number; userMarks: UserMarks }>('/sync', {
			method: 'POST',
			body: JSON.stringify(syncData)
		});

		if (result.success && result.data) {
			// Update local storage with server data
			this.setUserMarks(result.data.userMarks);
			this.setLastSyncTime();
		}

		return result;
	}

	// Offline support
	isOnline(): boolean {
		return navigator.onLine;
	}

	private queueOfflineAction(action: any): void {
		const queue = this.getCache<any[]>('offline_queue') || [];
		queue.push({
			...action,
			timestamp: new Date().toISOString()
		});
		this.setCache('offline_queue', queue);
	}

	async processOfflineQueue(userId: string): Promise<void> {
		if (!this.isOnline()) return;

		const queue = this.getCache<any[]>('offline_queue') || [];
		if (queue.length === 0) return;

		const processed: number[] = [];

		for (let i = 0; i < queue.length; i++) {
			const action = queue[i];
			
			try {
				switch (action.type) {
					case 'save_score':
						await this.saveScore(
							action.userId,
							action.paperId,
							action.questionId,
							action.score,
							action.maxScore
						);
						processed.push(i);
						break;
					
					case 'bulk_save':
						await this.saveBulkScores(action.data);
						processed.push(i);
						break;
				}
			} catch (error) {
				console.warn('Failed to process offline action:', error);
			}
		}

		// Remove processed actions from queue
		const remainingQueue = queue.filter((_, index) => !processed.includes(index));
		this.setCache('offline_queue', remainingQueue);
	}

	saveScoreOffline(userId: string, paperId: string, questionId: number, score: number, maxScore: number): void {
		// Save to local storage immediately
		const key = `${paperId}-${questionId}`;
		this.updateUserMark(key, score);

		// Queue for server sync when online
		this.queueOfflineAction({
			type: 'save_score',
			userId,
			paperId,
			questionId,
			score,
			maxScore
		});
	}

	// Utility methods
	clearAllData(): void {
		Object.values(this.STORAGE_KEYS).forEach(key => {
			localStorage.removeItem(key);
		});
	}

	exportData(): string {
		const data = {
			userId: this.getUserId(),
			userMarks: this.getUserMarks(),
			settings: this.getSettings(),
			lastSync: this.getLastSyncTime()?.toISOString()
		};
		
		return JSON.stringify(data, null, 2);
	}

	importData(jsonData: string): boolean {
		try {
			const data = JSON.parse(jsonData);
			
			if (data.userId) this.setUserId(data.userId);
			if (data.userMarks) this.setUserMarks(data.userMarks);
			if (data.settings) {
				Object.entries(data.settings).forEach(([key, value]) => {
					this.setSetting(key, value);
				});
			}
			if (data.lastSync) this.setLastSyncTime(new Date(data.lastSync));
			
			return true;
		} catch {
			return false;
		}
	}

	getStorageUsage(): { used: number; available: number; percentage: number } {
		let used = 0;
		
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				used += localStorage[key].length + key.length;
			}
		}
		
		// Rough estimate of localStorage limit (usually ~5-10MB)
		const available = 5 * 1024 * 1024; // 5MB
		const percentage = (used / available) * 100;
		
		return { used, available, percentage };
	}
}

// Default instance
export const storage = new StorageManager();