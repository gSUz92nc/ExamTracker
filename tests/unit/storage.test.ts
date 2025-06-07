import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../../src/lib/storage';
import type { UserMarks } from '../../src/lib/utils';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
	writable: true,
	value: true
});

describe('StorageManager', () => {
	let storage: StorageManager;

	beforeEach(() => {
		vi.clearAllMocks();
		storage = new StorageManager();
	});

	describe('User ID management', () => {
		it('should get user ID from localStorage', () => {
			localStorageMock.getItem.mockReturnValue('testUser123');
			
			const userId = storage.getUserId();
			
			expect(localStorageMock.getItem).toHaveBeenCalledWith('examtracker_user_id');
			expect(userId).toBe('testUser123');
		});

		it('should set user ID in localStorage', () => {
			storage.setUserId('newUser456');
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith('examtracker_user_id', 'newUser456');
		});

		it('should remove user ID from localStorage', () => {
			storage.removeUserId();
			
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_user_id');
		});

		it('should return null when no user ID exists', () => {
			localStorageMock.getItem.mockReturnValue(null);
			
			const userId = storage.getUserId();
			
			expect(userId).toBeNull();
		});
	});

	describe('User marks management', () => {
		it('should get user marks from localStorage', () => {
			const marks = { 'paper1-1': 10, 'paper1-2': 15 };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(marks));
			
			const userMarks = storage.getUserMarks();
			
			expect(localStorageMock.getItem).toHaveBeenCalledWith('examtracker_user_marks');
			expect(userMarks).toEqual(marks);
		});

		it('should return empty object when no marks exist', () => {
			localStorageMock.getItem.mockReturnValue(null);
			
			const userMarks = storage.getUserMarks();
			
			expect(userMarks).toEqual({});
		});

		it('should return empty object when marks are invalid JSON', () => {
			localStorageMock.getItem.mockReturnValue('invalid json');
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			
			const userMarks = storage.getUserMarks();
			
			expect(userMarks).toEqual({});
			expect(consoleSpy).toHaveBeenCalledWith('Failed to parse user marks from localStorage');
			
			consoleSpy.mockRestore();
		});

		it('should set user marks in localStorage', () => {
			const marks: UserMarks = { 'paper1-1': 10, 'paper1-2': 15 };
			
			storage.setUserMarks(marks);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_user_marks',
				JSON.stringify(marks)
			);
		});

		it('should update a single user mark', () => {
			const existingMarks = { 'paper1-1': 5, 'paper1-2': 10 };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(existingMarks));
			
			storage.updateUserMark('paper1-1', 15);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_user_marks',
				JSON.stringify({ 'paper1-1': 15, 'paper1-2': 10 })
			);
		});

		it('should remove user marks from localStorage', () => {
			storage.removeUserMarks();
			
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_user_marks');
		});
	});

	describe('Settings management', () => {
		it('should get settings from localStorage', () => {
			const settings = { theme: 'dark', autoSave: true };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));
			
			const result = storage.getSettings();
			
			expect(localStorageMock.getItem).toHaveBeenCalledWith('examtracker_settings');
			expect(result).toEqual(settings);
		});

		it('should return empty object when no settings exist', () => {
			localStorageMock.getItem.mockReturnValue(null);
			
			const settings = storage.getSettings();
			
			expect(settings).toEqual({});
		});

		it('should set a single setting', () => {
			const existingSettings = { theme: 'light' };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSettings));
			
			storage.setSetting('autoSave', true);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_settings',
				JSON.stringify({ theme: 'light', autoSave: true })
			);
		});
	});

	describe('Sync time management', () => {
		it('should get last sync time', () => {
			const timestamp = '2023-12-25T10:30:00.000Z';
			localStorageMock.getItem.mockReturnValue(timestamp);
			
			const lastSync = storage.getLastSyncTime();
			
			expect(localStorageMock.getItem).toHaveBeenCalledWith('examtracker_last_sync');
			expect(lastSync).toEqual(new Date(timestamp));
		});

		it('should return null when no sync time exists', () => {
			localStorageMock.getItem.mockReturnValue(null);
			
			const lastSync = storage.getLastSyncTime();
			
			expect(lastSync).toBeNull();
		});

		it('should set last sync time', () => {
			const testDate = new Date('2023-12-25T10:30:00.000Z');
			
			storage.setLastSyncTime(testDate);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_last_sync',
				testDate.toISOString()
			);
		});

		it('should set current time when no date provided', () => {
			const now = new Date();
			vi.setSystemTime(now);
			
			storage.setLastSyncTime();
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_last_sync',
				now.toISOString()
			);
			
			vi.useRealTimers();
		});
	});

	describe('Cache management', () => {
		it('should get cached data', () => {
			const cacheData = {
				testKey: {
					data: { value: 123 },
					timestamp: new Date().toISOString(),
					expires: null
				}
			};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData));
			
			const result = storage.getCache('testKey');
			
			expect(result).toEqual({ value: 123 });
		});

		it('should return null for expired cache', () => {
			const cacheData = {
				testKey: {
					data: { value: 123 },
					timestamp: new Date().toISOString(),
					expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
				}
			};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData));
			
			const result = storage.getCache('testKey');
			
			expect(result).toBeNull();
		});

		it('should set cache data with expiration', () => {
			const testData = { value: 123 };
			const expiresInMs = 60000; // 1 minute
			const now = new Date();
			vi.setSystemTime(now);
			
			storage.setCache('testKey', testData, expiresInMs);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_cache',
				expect.stringContaining('"testKey"')
			);
			
			vi.useRealTimers();
		});

		it('should remove item from cache', () => {
			const cacheData = {
				testKey: { data: 'test' },
				otherKey: { data: 'other' }
			};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData));
			
			storage.removeFromCache('testKey');
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_cache',
				JSON.stringify({ otherKey: { data: 'other' } })
			);
		});

		it('should clear all cache', () => {
			storage.clearCache();
			
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_cache');
		});
	});

	describe('API methods', () => {
		beforeEach(() => {
			storage = new StorageManager({ apiUrl: 'https://api.example.com' });
		});

		it('should save score via API', async () => {
			const mockResponse = { success: true, data: { id: 1 } };
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
				status: 200
			});
			
			const result = await storage.saveScore('user1', 'paper1', 1, 10, 15);
			
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/scores',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: expect.stringContaining('"userId":"user1"')
				})
			);
			expect(result.success).toBe(true);
		});

		it('should handle API errors', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});
			
			const result = await storage.saveScore('user1', 'paper1', 1, 10, 15);
			
			expect(result.success).toBe(false);
			expect(result.error).toBe('HTTP 500: Internal Server Error');
			expect(result.status).toBe(500);
		});

		it('should handle AbortError as timeout', async () => {
			storage = new StorageManager({ 
				apiUrl: 'https://api.example.com',
				timeout: 50 
			});
			
			const abortError = new Error('Request timeout');
			abortError.name = 'AbortError';
			
			(global.fetch as any).mockRejectedValue(abortError);
			
			const result = await storage.saveScore('user1', 'paper1', 1, 10, 15);
			
			expect(result.success).toBe(false);
			expect(result.error?.message).toBe('Request timeout');
		});

		it('should retry failed requests', async () => {
			storage = new StorageManager({ 
				apiUrl: 'https://api.example.com',
				retries: 1,
				retryDelay: 10
			});
			
			(global.fetch as any)
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ success: true }),
					status: 200
				});
			
			const result = await storage.saveScore('user1', 'paper1', 1, 10, 15);
			
			expect(global.fetch).toHaveBeenCalledTimes(2);
			expect(result.success).toBe(true);
		});

		it('should load user scores', async () => {
			const mockScores = [
				{ userId: 'user1', paperId: 'paper1', questionId: 1, score: 10 }
			];
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockScores),
				status: 200
			});
			
			const result = await storage.loadUserScores('user1');
			
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/users/user1/scores',
				expect.objectContaining({
					headers: { 'Content-Type': 'application/json' }
				})
			);
			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockScores);
		});

		it('should return error when API URL not configured', async () => {
			storage = new StorageManager(); // No API URL
			
			const result = await storage.saveScore('user1', 'paper1', 1, 10, 15);
			
			expect(result.success).toBe(false);
			expect(result.error).toBe('API URL not configured');
		});
	});

	describe('Offline support', () => {
		it('should detect online status', () => {
			expect(storage.isOnline()).toBe(true);
			
			Object.defineProperty(navigator, 'onLine', { value: false });
			expect(storage.isOnline()).toBe(false);
			
			Object.defineProperty(navigator, 'onLine', { value: true });
		});

		it('should save score offline', () => {
			const existingMarks = {};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(existingMarks));
			
			storage.saveScoreOffline('user1', 'paper1', 1, 10, 15);
			
			// Should update local storage
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'examtracker_user_marks',
				JSON.stringify({ 'paper1-1': 10 })
			);
		});
	});

	describe('Data management', () => {
		it('should clear all data', () => {
			storage.clearAllData();
			
			expect(localStorageMock.removeItem).toHaveBeenCalledTimes(5);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_user_id');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_user_marks');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_settings');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_cache');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('examtracker_last_sync');
		});

		it('should export data', () => {
			localStorageMock.getItem.mockImplementation((key) => {
				switch (key) {
					case 'examtracker_user_id':
						return 'testUser';
					case 'examtracker_user_marks':
						return JSON.stringify({ 'paper1-1': 10 });
					case 'examtracker_settings':
						return JSON.stringify({ theme: 'dark' });
					case 'examtracker_last_sync':
						return '2023-12-25T10:30:00.000Z';
					default:
						return null;
				}
			});
			
			const exportedData = storage.exportData();
			const parsed = JSON.parse(exportedData);
			
			expect(parsed.userId).toBe('testUser');
			expect(parsed.userMarks).toEqual({ 'paper1-1': 10 });
			expect(parsed.settings).toEqual({ theme: 'dark' });
			expect(parsed.lastSync).toBe('2023-12-25T10:30:00.000Z');
		});

		it('should import data successfully', () => {
			const importData = {
				userId: 'importedUser',
				userMarks: { 'paper1-1': 15 },
				settings: { theme: 'light' },
				lastSync: '2023-12-25T10:30:00.000Z'
			};
			
			const result = storage.importData(JSON.stringify(importData));
			
			expect(result).toBe(true);
			expect(localStorageMock.setItem).toHaveBeenCalledWith('examtracker_user_id', 'importedUser');
		});

		it('should handle invalid import data', () => {
			const result = storage.importData('invalid json');
			
			expect(result).toBe(false);
		});

		it('should calculate storage usage', () => {
			// Mock localStorage to have some data
			Object.defineProperty(localStorage, 'length', { value: 2 });
			Object.defineProperty(localStorage, 'key', {
				value: (index: number) => index === 0 ? 'key1' : 'key2'
			});
			localStorageMock.getItem.mockImplementation((key) => {
				return key === 'key1' ? 'value1' : 'value2';
			});
			
			// Mock hasOwnProperty
			Object.defineProperty(localStorage, 'hasOwnProperty', {
				value: () => true
			});
			
			// Mock the keys
			Object.defineProperty(localStorage, 'key1', { value: 'value1' });
			Object.defineProperty(localStorage, 'key2', { value: 'value2' });
			
			const usage = storage.getStorageUsage();
			
			expect(usage).toHaveProperty('used');
			expect(usage).toHaveProperty('available');
			expect(usage).toHaveProperty('percentage');
			expect(usage.available).toBe(5 * 1024 * 1024); // 5MB
		});
	});
});