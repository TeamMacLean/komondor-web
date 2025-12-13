# Sample Form Tests Documentation

This document describes the comprehensive test suite for the new sample form in the Komondor web application.

## Overview

The new sample form allows users to create either:

1. A single sample with detailed metadata
2. Multiple samples via TPlex CSV upload

## Test Coverage

### Unit Tests (`tests/unit/pages/samples-new.test.js`)

**Total: 55 tests - All passing ✅**

#### Component Rendering (6 tests)

- ✅ Renders component with project name
- ✅ Displays subtitle about creating single/multiple samples
- ✅ Renders TPlex checkbox
- ✅ Renders standard form fields by default
- ✅ Renders submit button
- ✅ Renders FormConsentCheckbox component

#### TPlex Mode Toggle (4 tests)

- ✅ Shows CSV upload when TPlex is checked
- ✅ Hides standard form fields when TPlex is checked
- ✅ Shows standard form when TPlex is unchecked
- ✅ Resets CSV data when switching TPlex mode

#### Computed Properties (21 tests)

**uploadsAreComplete:**

- ✅ Returns true when TPlex mode is active
- ✅ Returns true when uploader is not mounted
- ✅ Calls uploader's isUploadComplete method in standard mode
- ✅ Checks uploads are complete in TPlex mode
- ✅ Checks uploads are complete when no ref exists

**validationErrors - Standard Mode:**

- ✅ Returns error when sample name is missing
- ✅ Returns error when sample name is too short (< 3 chars)
- ✅ Returns error when sample name is too long (> 80 chars)
- ✅ Returns error when sample name already exists
- ✅ Returns error when scientific name is missing
- ✅ Returns error when scientific name is too short (< 5 chars)
- ✅ Returns error when common name is missing
- ✅ Returns error when common name is too short (< 3 chars)
- ✅ Returns error when NCBI ID is missing
- ✅ Returns error when NCBI ID is not a number
- ✅ Returns error when NCBI ID is zero or negative
- ✅ Returns error when conditions are missing
- ✅ Returns error when conditions are too short (< 50 chars)
- ✅ Returns no errors when all standard fields are valid

**validationErrors - TPlex Mode:**

- ✅ Returns error when TPlex mode active but no CSV validated
- ✅ Returns no errors when TPlex mode has validated CSV data

**canSubmit:**

- ✅ Returns false when already submitting
- ✅ Returns false when validation errors exist
- ✅ Returns false when consent is not given
- ✅ Returns true when all conditions are met

#### Methods (17 tests)

**initializeFromClonedSample:**

- ✅ Fetches cloned sample data and populates form
- ✅ Handles errors when fetching cloned sample

**validateTplexCsv:**

- ✅ Returns early if no file is uploaded
- ✅ Validates CSV with correct headers
- ✅ Shows error dialog when CSV headers are incorrect
- ✅ Handles CSV parsing errors

**submitForm:**

- ✅ Shows warning toast when form cannot be submitted
- ✅ Sets isSubmitting to true during submission
- ✅ Submits standard sample with correct payload
- ✅ Submits TPlex CSV with correct payload
- ✅ Shows success toast after successful submission
- ✅ Redirects to sample page after standard sample creation
- ✅ Redirects to project page after TPlex submission
- ✅ Handles submission errors
- ✅ Resets isSubmitting flag after error
- ✅ Handles errors without error response data

#### Watchers (2 tests)

- ✅ Resets CSV data when isTplexChecked changes
- ✅ Invalidates CSV data when file changes

#### Integration Tests (2 tests)

- ✅ Handles complete standard sample creation flow
- ✅ Handles complete TPlex creation flow

### E2E Tests (`tests/e2e/samples-new.spec.js`)

**Total: 41 tests**

The E2E tests cover:

- Page loading and rendering
- Standard form mode functionality
- TPlex CSV mode functionality
- Form validation
- Clone sample functionality
- Error handling
- Accessibility
- Authentication
- Form submission
- User experience

**Note:** E2E tests require authentication and a running backend API. Many tests will fail in isolation but pass in a properly configured test environment.

## Test Execution

### Run Unit Tests

```bash
npm test -- tests/unit/pages/samples-new.test.js
```

### Run E2E Tests

```bash
npx playwright test tests/e2e/samples-new.spec.js
```

### Run All Tests

```bash
npm test
```

## Key Test Patterns

### Mocking Components

The unit tests use stubs for Buefy components and custom components:

```javascript
stubs: {
  'b-field': { template: '<div><label v-if="label">{{ label }}</label><slot /></div>', props: ['label', 'type', 'message'] },
  'b-input': { template: '<input @input="$emit(\'input\', $event.target.value)" :value="value" />', props: ['value', 'type', 'required', 'minlength'] },
  'Uploader': { template: '<div class="mock-uploader"></div>', methods: { getFiles: vi.fn().mockReturnValue([]), isUploadComplete: vi.fn().mockReturnValue(true) } }
}
```

### Testing Async Operations

```javascript
it("should fetch cloned sample data and populate form", async () => {
  wrapper = createWrapper();
  wrapper.vm.$axios.get = vi
    .fn()
    .mockResolvedValueOnce({ data: clonedSampleData });
  await wrapper.vm.initializeFromClonedSample("cloned123");
  await wrapper.vm.$nextTick();
  expect(wrapper.vm.sample.name).toBe("Original Sample_clone");
});
```

### Testing Form Validation

```javascript
it("should return error when sample name is too short", () => {
  wrapper = createWrapper({
    sample: { name: "ab" /* other fields */ },
  });
  expect(wrapper.vm.validationErrors.name).toBe(
    "Name must be between 3 and 80 characters."
  );
});
```

## Validation Rules

### Standard Sample Form

- **Name:** 3-80 characters, must be unique within project
- **Scientific Name:** Minimum 5 characters
- **Common Name:** Minimum 3 characters
- **NCBI Taxonomy ID:** Positive integer
- **Conditions:** Minimum 50 characters

### TPlex CSV Format

Required headers:

- `name`
- `scientificName`
- `commonName`
- `ncbi`
- `conditions`

## Form Submission Behavior

### Standard Sample

1. Validates all fields
2. Checks consent is given
3. Verifies uploads are complete
4. Submits with project, group, and owner metadata
5. Redirects to sample detail page on success

### TPlex CSV

1. Validates CSV has been uploaded and validated
2. Checks consent is given
3. Submits CSV data with project, group, and owner metadata
4. Redirects to project page on success (shows all samples)

## Common Issues & Solutions

### Issue: Tests fail with "element not found"

**Solution:** Ensure stubs properly render labels and form structure. The component uses Buefy components that need to be stubbed correctly.

### Issue: Computed properties don't update in tests

**Solution:** Use `await wrapper.setData()` instead of direct assignment, and call `$nextTick()` to allow Vue to re-render.

### Issue: E2E tests timeout

**Solution:** E2E tests require authentication and a running backend. Use test fixtures or mock API responses for integration testing.

## Future Improvements

1. Add visual regression tests for form layout
2. Add tests for keyboard navigation and accessibility features
3. Add performance tests for large CSV file uploads
4. Add tests for concurrent form submissions
5. Mock API responses in E2E tests to avoid backend dependencies

## Related Files

- Component: `pages/samples/new.vue`
- Unit Tests: `tests/unit/pages/samples-new.test.js`
- E2E Tests: `tests/e2e/samples-new.spec.js`
- Similar tests: `tests/unit/pages/projects-new.test.js`, `tests/e2e/projects-new.spec.js`
