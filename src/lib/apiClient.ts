/**
 * Enhanced API client with retry logic, error handling, and offline support
 */

import { storage } from './storage';
import type { UserMarks } from './utils';

export interface ApiConfig {
	baseUrl: string;
	timeout?: number;
	retries?: number;
	retryDelay?: number;
	enableOfflineQueue?: boolean;
}

export interface ApiError {
	message: string;
	status?: number;
	code?: string;
	details?: any;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: ApiError;
	fromCache?: boolean;
}

export interface UserScore {
	id?: string;
	userId: string;
	paperId: string;
	questionId: number;
	score: number;
	maxScore: number;
	timestamp: string;
	lastModified?: string;
}

export interface SyncResult {
	synced: number;
	conflicts: number;
	errors: number;
	lastSync: string;
}

export class ApiClient {
	private config: Required<ApiConfig>;
	private abortController?: AbortController;
	private syncInProgress = false;

	constructor(config: ApiConfig) {
		this.config = {
			timeout: 10000,
			retries: 3,
			retryDelay: 1000,
			enableOfflineQueue: true,
			...config
		};
	}

	/**
	 * Make authenticated request to API
	 */
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0
	): Promise<ApiResponse<T>> {
		const url = `${this.config.baseUrl}${endpoint}`;
		
		// Create new abort controller for this request
		this.abortController = new AbortController();
		const timeoutId = setTimeout(() => {
			this.abortController?.abort();
		}, this.config.timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: this.abortController.signal,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					...options.headers
				}
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);
				return {
					success: false,
					error: {
						message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
						status: response.status,
						code: errorData.code,
						details: errorData.details
					}
				};
			}

			const data = await response.json();
			return { success: true, data };

		} catch (error) {
			clearTimeout(timeoutId);

			// Handle abort/timeout
			if (error instanceof Error && error.name === 'AbortError') {
				return {
					success: false,
					error: {
						message: 'Request timeout',
						code: 'TIMEOUT'
					}
				};
			}

			// Handle network errors with retry logic
			if (retryCount < this.config.retries && this.isRetryableError(error)) {
				await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
				return this.makeRequest(endpoint, options, retryCount + 1);
			}

			return {
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'Network error',
					code: 'NETWORK_ERROR',
					details: error
				}
			};
		}
	}

	/**
	 * Save user score to API
	 */
	async saveScore(
		userId: string,
		paperId: string,
		questionId: number,
		score: number,
		maxScore: number
	): Promise<ApiResponse<UserScore>> {
		const scoreData: Omit<UserScore, 'id'> = {
			userId,
			paperId,
			questionId,
			score,
			maxScore,
			timestamp: new Date().toISOString()
		};

		// If offline, queue the request
		if (!navigator.onLine && this.config.enableOfflineQueue) {
			storage.saveScoreOffline(userId, paperId, questionId, score, maxScore);
			return {
				success: true,
				data: { ...scoreData, id: 'offline' }
			};
		}

		const result = await this.makeRequest<UserScore>('/api/scores', {
			method: 'POST',
			body: JSON.stringify(scoreData)
		});

		// If request fails and offline queue is enabled, save locally
		if (!result.success && this.config.enableOfflineQueue) {
			storage.saveScoreOffline(userId, paperId, questionId, score, maxScore);
		}

		return result;
	}

	/**
	 * Load all scores for a user
	 */
	async loadUserScores(userId: string, useCache = true): Promise<ApiResponse<UserScore[]>> {
		const cacheKey = `user-scores-${userId}`;
		
		// Check cache first
		if (useCache) {
			const cached = storage.getCache<UserScore[]>(cacheKey);
			if (cached) {
				return { success: true, data: cached, fromCache: true };
			}
		}

		const result = await this.makeRequest<UserScore[]>(`/api/users/${userId}/scores`);

		// Cache successful results
		if (result.success && result.data) {
			storage.setCache(cacheKey, result.data, 5 * 60 * 1000); // 5 minutes cache
		}

		return result;
	}

	/**
	 * Load scores for specific paper
	 */
	async loadPaperScores(
		userId: string,
		paperId: string,
		useCache = true
	): Promise<ApiResponse<UserScore[]>> {
		const cacheKey = `paper-scores-${userId}-${paperId}`;
		
		if (useCache) {
			const cached = storage.getCache<UserScore[]>(cacheKey);
			if (cached) {
				return { success: true, data: cached, fromCache: true };
			}
		}

		const result = await this.makeRequest<UserScore[]>(
			`/api/users/${userId}/papers/${paperId}/scores`
		);

		if (result.success && result.data) {
			storage.setCache(cacheKey, result.data, 5 * 60 * 1000);
		}

		return result;
	}

	/**
	 * Bulk save multiple scores
	 */
	async saveBulkScores(
		userId: string,
		scores: Array<{
			paperId: string;
			questionId: number;
			score: number;
			maxScore: number;
		}>
	): Promise<ApiResponse<{ saved: number; errors: any[] }>> {
		const bulkData = {
			userId,
			scores: scores.map(s => ({
				...s,
				timestamp: new Date().toISOString()
			}))
		};

		if (!navigator.onLine && this.config.enableOfflineQueue) {
			// Save each score offline
			scores.forEach(score => {
				storage.saveScoreOffline(
					userId,
					score.paperId,
					score.questionId,
					score.score,
					score.maxScore
				);
			});

			return {
				success: true,
				data: { saved: scores.length, errors: [] }
			};
		}

		return this.makeRequest('/api/scores/bulk', {
			method: 'POST',
			body: JSON.stringify(bulkData)
		});
	}

	/**
	 * Sync local data with server
	 */
	async syncData(userId: string, force = false): Promise<ApiResponse<SyncResult>> {
		if (this.syncInProgress && !force) {
			return {
				success: false,
				error: {
					message: 'Sync already in progress',
					code: 'SYNC_IN_PROGRESS'
				}
			};
		}

		this.syncInProgress = true;

		try {
			// Get local data
			const localMarks = storage.getUserMarks();
			const lastSync = storage.getLastSyncTime();

			// Prepare sync payload
			const syncData = {
				userId,
				localMarks,
				lastSync: lastSync?.toISOString(),
				timestamp: new Date().toISOString()
			};

			const result = await this.makeRequest<{
				serverMarks: UserMarks;
				conflicts: Array<{
					key: string;
					localValue: number;
					serverValue: number;
					timestamp: string;
				}>;
				synced: number;
			}>('/api/sync', {
				method: 'POST',
				body: JSON.stringify(syncData)
			});

			if (result.success && result.data) {
				// Handle sync conflicts (for now, server wins)
				const resolvedMarks = { ...localMarks, ...result.data.serverMarks };
				storage.setUserMarks(resolvedMarks);
				storage.setLastSyncTime();

				// Process offline queue if online
				if (navigator.onLine) {
					await storage.processOfflineQueue(userId);
				}

				return {
					success: true,
					data: {
						synced: result.data.synced,
						conflicts: result.data.conflicts.length,
						errors: 0,
						lastSync: new Date().toISOString()
					}
				};
			}

			return result as ApiResponse<SyncResult>;

		} finally {
			this.syncInProgress = false;
		}
	}

	/**
	 * Delete all user data
	 */
	async deleteUserData(userId: string): Promise<ApiResponse<void>> {
		const result = await this.makeRequest(`/api/users/${userId}`, {
			method: 'DELETE'
		});

		if (result.success) {
			// Clear local data as well
			storage.clearAllData();
		}

		return result;
	}

	/**
	 * Health check
	 */
	async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
		return this.makeRequest('/api/health');
	}

	/**
	 * Cancel current request
	 */
	cancelRequest(): void {
		if (this.abortController) {
			this.abortController.abort();
		}
	}

	/**
	 * Check if API is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			const result = await this.healthCheck();
			return result.success;
		} catch {
			return false;
		}
	}

	/**
	 * Export user data
	 */
	async exportUserData(userId: string): Promise<ApiResponse<{
		scores: UserScore[];
		metadata: {
			exportDate: string;
			totalScores: number;
			subjects: string[];
		};
	}>> {
		return this.makeRequest(`/api/users/${userId}/export`);
	}

	/**
	 * Import user data
	 */
	async importUserData(
		userId: string,
		data: UserScore[]
	): Promise<ApiResponse<{ imported: number; skipped: number; errors: any[] }>> {
		return this.makeRequest(`/api/users/${userId}/import`, {
			method: 'POST',
			body: JSON.stringify({ scores: data })
		});
	}

	/**
	 * Get user statistics
	 */
	async getUserStats(userId: string): Promise<ApiResponse<{
		totalPapers: number;
		totalQuestions: number;
		averageScore: number;
		subjectBreakdown: Record<string, {
			papers: number;
			averageScore: number;
		}>;
		recentActivity: Array<{
			date: string;
			paperId: string;
			score: number;
		}>;
	}>> {
		const cacheKey = `user-stats-${userId}`;
		const cached = storage.getCache(cacheKey);
		
		if (cached) {
			return { success: true, data: cached, fromCache: true };
		}

		const result = await this.makeRequest(`/api/users/${userId}/stats`);

		if (result.success && result.data) {
			storage.setCache(cacheKey, result.data, 10 * 60 * 1000); // 10 minutes cache
		}

		return result;
	}

	/**
	 * Helper methods
	 */
	private async parseErrorResponse(response: Response): Promise<any> {
		try {
			return await response.json();
		} catch {
			return {
				message: response.statusText,
				code: `HTTP_${response.status}`
			};
		}
	}

	private isRetryableError(error: any): boolean {
		// Retry on network errors, timeouts, and 5xx status codes
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return true; // Network error
		}
		
		if (error?.status >= 500) {
			return true; // Server error
		}

		return false;
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: Partial<ApiConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): ApiConfig {
		return { ...this.config };
	}
}

// Default API client instance
let defaultClient: ApiClient | null = null;

export function createApiClient(config: ApiConfig): ApiClient {
	return new ApiClient(config);
}

export function getDefaultApiClient(): ApiClient {
	if (!defaultClient) {
		throw new Error('API client not initialized. Call initializeApiClient first.');
	}
	return defaultClient;
}

export function initializeApiClient(config: ApiConfig): ApiClient {
	defaultClient = new ApiClient(config);
	return defaultClient;
}

// Connection status monitoring
export class ConnectionMonitor {
	private listeners: Set<(online: boolean) => void> = new Set();
	private _isOnline = navigator.onLine;

	constructor() {
		window.addEventListener('online', this.handleOnline.bind(this));
		window.addEventListener('offline', this.handleOffline.bind(this));
	}

	get isOnline(): boolean {
		return this._isOnline;
	}

	private handleOnline(): void {
		this._isOnline = true;
		this.notifyListeners(true);
	}

	private handleOffline(): void {
		this._isOnline = false;
		this.notifyListeners(false);
	}

	private notifyListeners(online: boolean): void {
		this.listeners.forEach(listener => {
			try {
				listener(online);
			} catch (error) {
				console.error('Error in connection status listener:', error);
			}
		});
	}

	addListener(listener: (online: boolean) => void): void {
		this.listeners.add(listener);
	}

	removeListener(listener: (online: boolean) => void): void {
		this.listeners.delete(listener);
	}

	destroy(): void {
		window.removeEventListener('online', this.handleOnline.bind(this));
		window.removeEventListener('offline', this.handleOffline.bind(this));
		this.listeners.clear();
	}
}

// Global connection monitor instance
export const connectionMonitor = new ConnectionMonitor();