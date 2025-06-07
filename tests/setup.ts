import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.confirm for tests
Object.defineProperty(window, 'confirm', {
	writable: true,
	value: vi.fn(() => true)
});

// Mock window.alert for tests
Object.defineProperty(window, 'alert', {
	writable: true,
	value: vi.fn()
});

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

// Mock fetch for API calls
global.fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});