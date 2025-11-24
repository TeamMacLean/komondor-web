# Komondor Web Test Suite

Comprehensive test documentation for the Komondor web application.

## Overview

This test suite provides thorough coverage of the Komondor web application, with particular focus on the three main form creation workflows: Projects, Samples, and Runs.

## Test Structure

```
tests/
├── README.md                          # This file
├── README_SAMPLES.md                  # Sample form test documentation
├── README_RUNS.md                     # Run form test documentation
├── components/                        # Component unit tests
│   └── NewsCard.test.js
├── e2e/                              # End-to-end tests (Playwright)
│   ├── form-submissions.spec.js      # Cross-form submission tests
│   ├── homepage.spec.js
│   ├── navigation.spec.js
│   ├── projects-new.spec.js          # New project E2E tests
│   ├── samples-new.spec.js           # New sample E2E tests (NEW!)
│   ├── runs-new.spec.js              # New run E2E tests (NEW!)
│   └── smoke.spec.js
├── pages/
│   └── runs/
│       └── new.test.js               # Run page tests (partial)
├── unit/                             # Unit tests (Vitest)
│   ├── example.test.js
│   ├── pages/
│   │   ├── projects-new.test.js      # New project unit tests
│   │   ├── samples-new.test.js       # New sample unit tests (NEW!)
│   │   └── runs-new.test.js          # New run unit tests (NEW!)
│   └── utils/
│       └── validators.test.js
├── setup.js
└── vitest.config.js
```

## Test Coverage Summary

### Form Tests Overview

| Form | Unit Tests | E2E Tests | Status | Complexity |
|------|-----------|-----------|---------|------------|
| **New Project** | ✅ Comprehensive | ✅ 25+ tests | Complete | Medium |
| **New Sample** | ✅ 55 tests | ✅ 41 tests | Complete | Medium |
| **New Run** | ✅ 55 tests | ✅ 55 tests | Complete | High |

### Detailed Coverage by Form

#### New Project Form (`pages/projects/new.vue`)
- **Unit Tests:** Comprehensive coverage of form validation, Vuex integration, file uploads
- **E2E Tests:** 25+ tests covering page loading, field validation, submission
- **Key Features:**
  - Group selection
  - ENA submission toggle
  - File uploads with consent
  - Project name uniqueness validation

#### New Sample Form (`pages/samples/new.vue`)
- **Unit Tests:** 55 tests - All passing ✅
- **E2E Tests:** 41 tests
- **Key Features:**
  - Standard single sample creation
  - TPlex CSV batch upload mode
  - Clone sample functionality
  - Field validation (name, scientific name, NCBI taxonomy, conditions)

#### New Run Form (`pages/runs/new.vue`)
- **Unit Tests:** 55 tests - All passing ✅
- **E2E Tests:** 55 tests
- **Key Features:**
  - HPC file transfer mode
  - Local filesystem upload with MD5 validation
  - Vuex integration for sequencing options
  - Dynamic validation based on library type
  - Complex state management

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- tests/unit/pages/projects-new.test.js
npm test -- tests/unit/pages/samples-new.test.js
npm test -- tests/unit/pages/runs-new.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/projects-new.spec.js
npx playwright test tests/e2e/samples-new.spec.js
npx playwright test tests/e2e/runs-new.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

## Test Technologies

### Unit Testing
- **Framework:** [Vitest](https://vitest.dev/)
- **Component Testing:** Vue Test Utils (@vue/test-utils)
- **Mocking:** Vitest built-in mocking
- **State Management:** Vuex with localVue

### E2E Testing
- **Framework:** [Playwright](https://playwright.dev/)
- **Browsers:** Chromium, Firefox, WebKit
- **Video Recording:** Enabled for failed tests
- **Screenshots:** Captured on failure

## Test Patterns & Best Practices

### Unit Test Patterns

#### 1. Component Wrapper Creation
```javascript
const createWrapper = (dataOverrides = {}) => {
  return mount(Component, {
    localVue,
    store,
    mocks: {
      $axios: mockAxios,
      $auth: mockAuth,
      $router: mockRouter,
      $buefy: mockBuefy,
    },
    stubs: {
      'b-field': { template: '<div><label v-if="label">{{ label }}</label><slot /></div>' },
      'b-input': { template: '<input @input="$emit(\'input\', $event.target.value)" />' }
    },
    data() {
      return { ...defaultData, ...dataOverrides };
    }
  });
};
```

#### 2. Async Operations
```javascript
it('should handle async data loading', async () => {
  wrapper.vm.$axios.get = vi.fn().mockResolvedValueOnce({ data: mockData });
  await wrapper.vm.fetchData();
  await wrapper.vm.$nextTick();
  expect(wrapper.vm.data).toEqual(mockData);
});
```

#### 3. Form Validation Testing
```javascript
it('should validate field length', () => {
  wrapper = createWrapper({
    form: { name: 'ab' } // Too short
  });
  expect(wrapper.vm.validationErrors.name).toBe('Name must be at least 3 characters.');
});
```

### E2E Test Patterns

#### 1. Page Navigation
```javascript
test('should load the page', async ({ page }) => {
  await page.goto('/projects/new');
  await page.waitForLoadState('domcontentloaded');
  const title = page.locator('h1.title');
  await expect(title).toBeVisible({ timeout: 10000 });
});
```

#### 2. Form Interaction
```javascript
test('should fill form fields', async ({ page }) => {
  const nameInput = page.locator('input[name="name"]');
  await nameInput.fill('Test Project Name');
  const value = await nameInput.inputValue();
  expect(value).toBe('Test Project Name');
});
```

#### 3. API Mocking
```javascript
test('should handle API errors', async ({ page }) => {
  await page.route('**/api/projects', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' })
    });
  });
  await page.goto('/projects/new');
  // Test error handling...
});
```

## Validation Rules Reference

### Project Form
- **Name:** 20-80 characters, unique
- **Short Description:** 20-200 characters
- **Long Description:** 100-1000 characters
- **Group:** Required selection
- **Consent:** Required checkbox

### Sample Form
- **Name:** 3-80 characters, unique within project
- **Scientific Name:** Minimum 5 characters
- **Common Name:** Minimum 3 characters
- **NCBI Taxonomy ID:** Positive integer
- **Conditions:** Minimum 50 characters
- **TPlex CSV:** Must have headers: name, scientificName, commonName, ncbi, conditions

### Run Form
- **Name:** 3-80 characters, unique within sample
- **Sequencing Provider:** Required
- **Library Type:** Required (dropdown)
- **Sequencing Technology:** Required (dropdown)
- **Library Source:** Required (dropdown)
- **Library Selection:** Required (dropdown)
- **Library Strategy:** Required (dropdown)
- **Insert Size:** Optional integer
- **Raw Files (HPC):** At least one validated file
- **Raw Files (Local):** At least one file with MD5 validation

## Common Testing Issues & Solutions

### Issue: "element not found" in tests
**Solution:** Ensure stubs properly render labels and form structure. Use appropriate timeouts and wait for elements.

### Issue: Computed properties don't update
**Solution:** Use `await wrapper.setData()` instead of direct assignment, and call `$nextTick()`.

### Issue: Vuex store errors
**Solution:** Create localVue instance and call `Vue.use(Vuex)` before creating store.

### Issue: FileReader not working in tests
**Solution:** Mock FileReader globally with proper async behavior.

### Issue: E2E tests timeout
**Solution:** E2E tests require authentication and backend. Use longer timeouts or mock API responses.

### Issue: Refs don't work in unit tests
**Solution:** Test behavior indirectly through computed properties or set refs explicitly after mounting.

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test
```

## Code Coverage

Current coverage metrics:

- **Unit Tests:** High coverage for form components
- **E2E Tests:** Comprehensive user flow coverage
- **Integration Tests:** Cross-form validation tests

To generate coverage report:
```bash
npm test -- --coverage
```

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use descriptive test names that explain what is being tested
3. Keep tests focused and atomic (one assertion per test when possible)
4. Mock external dependencies appropriately
5. Document complex test scenarios
6. Ensure tests are deterministic (no flaky tests)

### Test Naming Conventions

```javascript
// Unit tests
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});

// E2E tests
test.describe('Page Name', () => {
  test('should perform user action', async ({ page }) => {
    // Test implementation
  });
});
```

## Additional Resources

- **Project Tests:** See `tests/unit/pages/projects-new.test.js` and `tests/e2e/projects-new.spec.js`
- **Sample Tests:** See `README_SAMPLES.md` for detailed documentation
- **Run Tests:** See `README_RUNS.md` for detailed documentation
- **Vitest Docs:** https://vitest.dev/
- **Playwright Docs:** https://playwright.dev/
- **Vue Test Utils:** https://test-utils.vuejs.org/

## Test Maintenance

### Regular Tasks
- Review and update tests when components change
- Remove obsolete tests
- Add tests for new features
- Refactor duplicate test code
- Update mocks when APIs change

### Performance
- Unit tests should run in < 1 second per test
- E2E tests should run in < 10 seconds per test
- Use appropriate timeouts to avoid flaky tests
- Clean up test artifacts regularly

## Summary

This test suite provides comprehensive coverage of the Komondor web application's core functionality. With **165+ tests** across unit and E2E categories, the three main form workflows (Projects, Samples, and Runs) are thoroughly tested to ensure reliability and maintainability.

**Key Achievements:**
- ✅ All unit tests passing (55 + 55 + existing)
- ✅ Comprehensive E2E coverage (41 + 55 + existing)
- ✅ Well-documented test patterns
- ✅ Easy to extend and maintain

For specific form documentation, see:
- [Sample Form Tests](./README_SAMPLES.md)
- [Run Form Tests](./README_RUNS.md)