# ExamTracker Development Guide

Welcome to the ExamTracker development guide! This comprehensive document will help you understand the project structure, development workflow, and best practices for contributing to the ExamTracker application.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Code Standards](#code-standards)
8. [API Integration](#api-integration)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)

## Project Overview

ExamTracker is a modern web application built with SvelteKit that helps students track their exam performance across different subjects and exam boards. The application provides comprehensive analytics, progress tracking, and performance insights.

### Key Features

- **Paper Management**: Browse and filter past papers by subject, board, year, and session
- **Score Tracking**: Record and manage question-level scores
- **Performance Analytics**: Detailed statistics and progress visualization
- **Offline Support**: Continue working without internet connection
- **Data Sync**: Synchronize data across devices
- **Export/Import**: Backup and restore performance data

### Technology Stack

- **Frontend**: SvelteKit 2.x, TypeScript, TailwindCSS
- **Backend**: Cloudflare Workers (serverless)
- **Database**: PocketBase / Cloudflare D1
- **Testing**: Vitest, Testing Library
- **Build**: Vite, Bun
- **Deployment**: Cloudflare Pages

## Architecture

### Frontend Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │◄──►│     Logic       │◄──►│     Layer       │
│                 │    │                 │    │                 │
│ • Svelte Pages  │    │ • Utils         │    │ • API Client    │
│ • Components    │    │ • Stores        │    │ • Storage Mgr   │
│ • Styles        │    │ • Validation    │    │ • Cache         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Interaction** → Component
2. **Component** → Business Logic (utils/stores)
3. **Business Logic** → Data Layer (API/Storage)
4. **Data Layer** → Backend/Cache
5. **Response** → Business Logic → Component → UI Update

### State Management

- **Local State**: Svelte's reactive `$state` for component-level data
- **Global State**: Svelte stores for app-wide state
- **Persistent State**: localStorage with StorageManager
- **Remote State**: API client with caching

## Development Setup

### Prerequisites

- **Bun**: Latest version (package manager and runtime)
- **Node.js**: 18+ (for compatibility)
- **Git**: For version control
- **VS Code**: Recommended editor

### Quick Start

```bash
# Clone the repository
git clone https://github.com/gSUz92nc/ExamTracker.git
cd ExamTracker

# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun run test

# Build for production
bun run build
```

### Environment Setup

Create `.env` file from template:

```bash
cp .env.template .env
```

Configure environment variables:

```env
# Development
PUBLIC_API_URL=http://localhost:8787
PUBLIC_ENVIRONMENT=development

# Production (set in Cloudflare Pages)
PUBLIC_API_URL=https://api.examtracker.com
PUBLIC_ENVIRONMENT=production
```

### VS Code Configuration

Recommended extensions:

- Svelte for VS Code
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

## Project Structure

```
ExamTracker/
├── src/                          # Source code
│   ├── app.css                   # Global styles
│   ├── app.html                  # HTML template
│   ├── lib/                      # Shared libraries
│   │   ├── components/           # Reusable components
│   │   │   └── PerformanceTracker.svelte
│   │   ├── stores/               # Svelte stores
│   │   ├── apiClient.ts          # API communication
│   │   ├── pastPapers.ts         # Paper data types
│   │   ├── sampleData.ts         # Test data generator
│   │   ├── storage.ts            # Local storage manager
│   │   └── utils.ts              # Utility functions
│   └── routes/                   # SvelteKit routes
│       ├── +layout.svelte        # Root layout
│       ├── +page.svelte          # Main application
│       └── api/                  # API routes (if any)
├── tests/                        # Test files
│   ├── setup.ts                  # Test configuration
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── temp/                         # Temporary files
│   ├── cache/                    # Development cache
│   ├── logs/                     # Development logs
│   └── test-data/                # Sample test data
├── static/                       # Static assets
├── bun.lock                      # Dependency lock file
├── package.json                  # Package configuration
├── svelte.config.js              # Svelte configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── vitest.config.ts              # Test configuration
```

### Key Directories

- **`src/lib/`**: Shared utilities and components
- **`src/routes/`**: Pages and API endpoints
- **`tests/`**: All test files
- **`temp/`**: Development artifacts (git-ignored)
- **`static/`**: Static assets served directly

## Development Workflow

### Branch Strategy

- **`main`**: Production-ready code
- **`development`**: Active development branch
- **`feature/*`**: Feature development
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes

### Development Process

1. **Create Feature Branch**
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. **Development Cycle**
   ```bash
   # Start dev server
   bun run dev
   
   # Run tests in watch mode
   bun run test
   
   # Check code quality
   bun run lint
   bun run format
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request to development branch
   ```

### Commit Convention

Follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build process or auxiliary tool changes

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Component interactions
3. **End-to-End Tests**: Full user workflows

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

### Writing Tests

#### Unit Test Example

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateGrade } from '../../src/lib/utils';

describe('calculateGrade', () => {
  it('should return A* for scores 90% and above', () => {
    expect(calculateGrade(95)).toBe('A*');
    expect(calculateGrade(90)).toBe('A*');
  });
});
```

#### Component Test Example

```typescript
// tests/unit/Component.test.ts
import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import Component from '../../src/lib/components/Component.svelte';

it('should render component correctly', () => {
  render(Component, { props: { title: 'Test' } });
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Test Data

Use the sample data generator for consistent test data:

```typescript
import { getSmallTestDataset } from '../../src/lib/sampleData';

const { papers, userMarks } = getSmallTestDataset();
```

## Code Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` type

```typescript
// Good
interface UserScore {
  userId: string;
  score: number;
  timestamp: Date;
}

function calculateAverage(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

// Avoid
function calculate(data: any): any {
  // ...
}
```

### Svelte Components

- Use TypeScript for all components
- Keep components focused and single-responsibility
- Use props for data input, events for actions
- Follow naming conventions

```svelte
<!-- Good: PascalCase for components -->
<script lang="ts">
  interface Props {
    title: string;
    score: number;
    onScoreChange?: (score: number) => void;
  }
  
  let { title, score, onScoreChange }: Props = $props();
  
  function handleChange(newScore: number): void {
    onScoreChange?.(newScore);
  }
</script>

<div class="score-display">
  <h2>{title}</h2>
  <span class="score">{score}</span>
</div>
```

### CSS/Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use semantic class names for custom CSS
- Prefer CSS Grid and Flexbox for layouts

```svelte
<!-- Good: Tailwind classes -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white rounded-lg shadow-md p-6">
    <!-- Content -->
  </div>
</div>

<style>
  /* Custom styles when needed */
  .score-display {
    @apply flex items-center justify-between;
  }
</style>
```

### Error Handling

- Use Result pattern for operations that can fail
- Provide meaningful error messages
- Log errors appropriately

```typescript
// Good: Result pattern
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function saveScore(score: UserScore): Promise<Result<UserScore>> {
  try {
    const result = await apiClient.saveScore(score);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to save score:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
```

## API Integration

### API Client Usage

```typescript
import { apiClient } from '$lib/apiClient';

// Save a score
const result = await apiClient.saveScore(userId, paperId, questionId, score, maxScore);
if (result.success) {
  console.log('Score saved:', result.data);
} else {
  console.error('Failed to save:', result.error);
}

// Load user scores
const scores = await apiClient.loadUserScores(userId);
```

### Offline Support

The application works offline by:

1. Storing data locally
2. Queuing API requests when offline
3. Syncing when connection is restored

```typescript
import { storage } from '$lib/storage';

// Save offline
storage.saveScoreOffline(userId, paperId, questionId, score, maxScore);

// Sync when online
await storage.processOfflineQueue(userId);
```

### Error Handling

```typescript
// Handle API errors gracefully
async function loadData() {
  const result = await apiClient.loadUserScores(userId);
  
  if (!result.success) {
    // Try loading from cache
    const cached = storage.getUserMarks();
    if (Object.keys(cached).length > 0) {
      return { success: true, data: cached, fromCache: true };
    }
    
    // Show error to user
    showError('Failed to load data. Please try again.');
    return result;
  }
  
  return result;
}
```

## Performance Optimization

### Best Practices

1. **Lazy Loading**: Load components and data only when needed
2. **Virtual Scrolling**: For large lists of papers
3. **Debouncing**: For search and input operations
4. **Caching**: Cache API responses and computed data
5. **Code Splitting**: Split code by routes and features

### Implementation Examples

```typescript
// Debounced search
import { debounce } from '$lib/utils';

const debouncedSearch = debounce((query: string) => {
  searchPapers(query);
}, 300);

// Lazy loading component
const LazyComponent = lazy(() => import('./HeavyComponent.svelte'));

// Virtual scrolling for large lists
<VirtualList items={papers} itemHeight={60} let:item>
  <PaperCard paper={item} />
</VirtualList>
```

### Monitoring

Monitor performance with:

- Chrome DevTools Performance tab
- Lighthouse audits
- Core Web Vitals
- Custom performance metrics

## Deployment

### Development Deployment

```bash
# Build the application
bun run build

# Preview the build
bun run preview
```

### Production Deployment

The application is deployed to Cloudflare Pages:

1. **Automatic Deployment**: Pushes to `main` trigger deployment
2. **Preview Deployments**: PRs get preview URLs
3. **Environment Variables**: Set in Cloudflare Pages dashboard

### Environment Configuration

Production environment variables:

```env
PUBLIC_API_URL=https://api.examtracker.com
PUBLIC_ENVIRONMENT=production
CLOUDFLARE_API_TOKEN=your_token_here
```

## Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear dependencies and reinstall
rm -rf node_modules bun.lockb
bun install

# Clear build cache
rm -rf .svelte-kit
bun run build
```

#### Test Failures

```bash
# Update test snapshots
bun run test -- --update-snapshots

# Run specific test file
bun run test tests/unit/utils.test.ts

# Debug failing tests
bun run test:ui
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
bun run check

# Restart TypeScript server in VS Code
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Development Server Issues

1. **Port Already in Use**: Change port in `vite.config.ts`
2. **Hot Reload Not Working**: Check file watchers and permissions
3. **Environment Variables**: Ensure `.env` file is properly configured

### Performance Issues

1. **Slow Build**: Enable build caching, optimize imports
2. **Runtime Performance**: Use Chrome DevTools to profile
3. **Memory Leaks**: Check for uncleaned event listeners

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch from `development`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Guidelines

- **Title**: Clear and descriptive
- **Description**: Explain what and why
- **Testing**: Include test cases
- **Documentation**: Update relevant docs
- **Breaking Changes**: Clearly marked

### Code Review Process

1. **Automated Checks**: Tests, linting, type checking
2. **Peer Review**: At least one reviewer approval
3. **Final Review**: Maintainer approval
4. **Merge**: Squash and merge to development

### Reporting Issues

When reporting issues, include:

- **Environment**: OS, browser, versions
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable

### Feature Requests

For new features:

- **Use Case**: Why is this needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Implementation**: Technical considerations

## Additional Resources

### Documentation

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

### Tools

- [Svelte DevTools](https://github.com/sveltejs/svelte-devtools)
- [Vite DevTools](https://github.com/antfu/vite-plugin-vue-devtools)
- [TypeScript Error Translator](https://ts-error-translator.vercel.app/)

### Community

- [Svelte Discord](https://svelte.dev/chat)
- [GitHub Discussions](https://github.com/gSUz92nc/ExamTracker/discussions)
- [Project Issues](https://github.com/gSUz92nc/ExamTracker/issues)

---

*This guide is a living document. Please update it as the project evolves and feel free to suggest improvements!*