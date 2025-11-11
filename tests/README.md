# Testing Documentation

This directory contains all tests for the Komondor Web application using **Vitest** (unit/component tests) and **Playwright** (E2E tests).

## 📁 Directory Structure

```
tests/
├── unit/              # Unit tests for utility functions and business logic
├── components/        # Component tests for Vue components
├── e2e/              # End-to-end tests with Playwright
├── setup.js          # Vitest setup and global test configuration
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 24+ (specified in `.nvmrc`)
- All dependencies installed: `npm install`

### Running Tests

#### Unit & Component Tests (Vitest)

```bash
# Run all unit/component tests once
npm run test:unit

# Run tests in watch mode (auto-rerun on file changes)
npm run test:unit:watch
# or simply
npm test

# Run tests with UI interface
npm run test:unit:ui

# Run tests with coverage report
npm run test:coverage
```

#### E2E Tests (Playwright)

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI interface
npm run test:e2e:ui

# Run E2E tests in headed mode (see the browser)
npm run test:e2e:headed

# Debug E2E tests (step through with debugger)
npm run test:e2e:debug
```

#### Run All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## 📝 Writing Tests

### Unit Tests (Vitest)

Unit tests are for testing pure functions and business logic in isolation.

**Example: `tests/unit/example.test.js`**

```javascript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return expected output', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Component Tests (Vitest + Vue Test Utils)

Component tests verify Vue component behavior and rendering.

**Example: `tests/components/MyComponent.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '~/components/MyComponent.vue';

describe('MyComponent.vue', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      propsData: { message: 'Hello' },
      stubs: {
        'nuxt-link': true,
        'b-icon': true
      }
    });

    expect(wrapper.text()).toContain('Hello');
  });
});
```

**Common Gotchas:**
- Always stub Nuxt-specific components (`nuxt-link`, `client-only`, etc.)
- Use `stubs` to replace child components with simple placeholders
- Mock `$axios`, `$auth`, `$router` as needed (see `tests/setup.js`)

### E2E Tests (Playwright)

E2E tests verify the entire application flow from a user's perspective.

**Example: `tests/e2e/myfeature.spec.js`**

```javascript
import { test, expect } from '@playwright/test';

test('should load the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

**Best Practices:**
- Use `page.waitForLoadState('networkidle')` for dynamic content
- Use data attributes (`data-testid`) for reliable selectors
- Group related tests with `test.describe()`
- Test user flows, not implementation details

## 🧪 Test Examples Included

### Unit Tests
- ✅ `tests/unit/example.test.js` - Basic utility function tests
  - Math operations
  - String manipulation
  - Array methods
  - Object operations
  - Async/await patterns

### Component Tests
- ✅ `tests/components/NewsCard.test.js` - NewsCard component
  - Rendering
  - Props handling
  - Computed properties
  - Date formatting
  - User display logic
  - Text truncation

### E2E Tests
- ✅ `tests/e2e/homepage.spec.js` - Homepage functionality
  - Page loads successfully
  - Title and meta tags
  - Hero section visibility
  - Responsive design (mobile, tablet, desktop)
  - Performance benchmarks
  
- ✅ `tests/e2e/navigation.spec.js` - Navigation and routing
  - Page transitions
  - Back/forward navigation
  - Deep linking
  - 404 handling
  - URL parameters
  - Hash fragments

## 🔧 Configuration

### Vitest Configuration

File: `vitest.config.js`

- **Environment:** jsdom (simulates browser environment)
- **Test Files:** `tests/unit/**/*.test.js`, `tests/components/**/*.test.js`
- **Setup:** `tests/setup.js` (global mocks and utilities)
- **Coverage:** v8 provider, HTML/text reports

### Playwright Configuration

File: `playwright.config.js`

- **Test Directory:** `tests/e2e/`
- **Base URL:** `http://localhost:3000`
- **Browsers:** Chromium (Firefox and WebKit commented out)
- **Web Server:** Auto-starts `npm run dev` before tests
- **Retries:** 2 on CI, 0 locally
- **Timeout:** 120 seconds for server startup

## 🎯 Testing Strategy

### What to Test

#### Unit Tests ✅
- Utility functions
- Data transformations
- Validation logic
- Business rules
- Helper functions

#### Component Tests ✅
- Component renders correctly
- Props are handled properly
- Events are emitted
- Computed properties work
- User interactions (clicks, inputs)
- Conditional rendering

#### E2E Tests ✅
- User workflows (login, create project, etc.)
- Page navigation
- Form submissions
- Data persistence
- Error handling
- Responsive behavior

### What NOT to Test

- Third-party library internals
- Nuxt.js framework code
- Browser API implementations
- CSS styling details (use visual regression testing tools instead)

## 🐛 Debugging Tests

### Debugging Vitest Tests

```bash
# Run a specific test file
npx vitest tests/unit/example.test.js

# Run tests matching a pattern
npx vitest --grep "NewsCard"

# Open UI for visual debugging
npm run test:unit:ui
```

### Debugging Playwright Tests

```bash
# Run with debugger
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/homepage.spec.js

# Run specific test by name
npx playwright test --grep "should load the homepage"

# Generate trace for failed tests
npx playwright test --trace on
```

### Common Issues

#### Vitest Issues

**Problem:** `Cannot find module '~/components/MyComponent.vue'`
- **Solution:** Check alias configuration in `vitest.config.js`

**Problem:** `$axios is not defined`
- **Solution:** Add mock to `tests/setup.js` or local test file

**Problem:** Component doesn't render
- **Solution:** Ensure all child components are stubbed

#### Playwright Issues

**Problem:** Test times out
- **Solution:** Increase timeout or check if dev server is running

**Problem:** Element not found
- **Solution:** Add `await page.waitForLoadState('networkidle')`

**Problem:** Flaky tests
- **Solution:** Use more specific selectors and proper wait conditions

## 📊 Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- `coverage/` - HTML reports (open `coverage/index.html` in browser)
- Console output shows summary

**Coverage Goals:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:e2e
```

## 📚 Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils (Vue 2)](https://v1.test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Nuxt 2 Testing](https://nuxtjs.org/docs/get-started/testing/)

### Useful Matchers

#### Vitest/Jest Matchers
```javascript
expect(value).toBe(expected)           // Exact equality (===)
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()             // Truthy value
expect(value).toContain(item)          // Array/string contains
expect(value).toHaveLength(number)     // Array/string length
expect(fn).toHaveBeenCalled()          // Mock was called
expect(fn).toThrow()                   // Function throws error
```

#### Playwright Matchers
```javascript
await expect(page).toHaveURL(url)
await expect(locator).toBeVisible()
await expect(locator).toContainText(text)
await expect(locator).toHaveAttribute(name, value)
await expect(locator).toHaveCount(number)
```

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Unit test** core logic and utilities
3. **Component test** Vue components
4. **E2E test** critical user flows
5. Ensure all tests pass before submitting PR
6. Maintain or improve coverage percentage

## 📞 Support

For questions or issues:
- Check existing test examples
- Review documentation links above
- Ask the team in #komondor-dev

---

**Happy Testing! 🧪✨**