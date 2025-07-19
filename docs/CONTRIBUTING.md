# Contributing to FSP Navigator

## Testing Setup and Guidelines

### Overview

This project includes comprehensive regression tests to prevent UI regressions and ensure data integrity. The tests are designed to catch issues early and maintain code quality.

### Running Tests

#### Prerequisites
- Node.js 18+ 
- npm or yarn

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Run All Tests
```bash
npm test
```

#### Run Tests in Watch Mode
```bash
npm test -- --watch
```

#### Run Specific Test Files
```bash
npm test -- --testPathPattern=LeaderboardModal
npm test -- --testPathPattern=InteractiveTutorial
npm test -- --testPathPattern=ToggleBar
```

#### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Test Structure

#### Regression Tests
The following regression tests ensure UI components work correctly:

1. **`competitionQuestions.test.js`**
   - Tests data integrity for competition questions
   - Validates question structure and answer options
   - Ensures competition configuration is complete
   - Snapshot tests for data structure consistency

2. **`LeaderboardModal.test.jsx`**
   - Tests modal rendering and tab navigation
   - Validates user rankings display
   - Tests mini-game functionality
   - Ensures graceful handling of missing data
   - Tests competition display and interaction

3. **`InteractiveTutorial.test.jsx`**
   - Tests tutorial step navigation
   - Validates progress indicators
   - Tests keyboard navigation
   - Ensures proper CSS target validation
   - Tests completion flow

4. **`ToggleBar.test.jsx`**
   - Tests progress mode switching
   - Validates toggle button functionality
   - Tests responsive design classes
   - Ensures proper state management

### Why These Tests Exist

#### Regression Prevention
These tests were created after identifying four critical UI regressions:

1. **Node Colors**: Subscription-based node access was broken
2. **ToggleBar Component**: Progress toggle functionality was missing
3. **Joyride Tutorial**: Tutorial steps were not working properly
4. **Clasament Leaderboard**: Component was crashing due to missing data

#### Data Integrity
- `competitionQuestions.test.js` prevents crashes from missing or malformed competition data
- Tests ensure all required properties exist and have correct types
- Validates that competition configurations match available game types

#### UI Functionality
- Tests verify that components render correctly
- Ensure user interactions work as expected
- Validate responsive design behavior
- Test error handling and graceful degradation

### Test Best Practices

#### Writing New Tests
1. **Test the Happy Path**: Ensure components work correctly under normal conditions
2. **Test Error States**: Verify graceful handling of missing data or errors
3. **Test User Interactions**: Validate click handlers, form submissions, etc.
4. **Use Descriptive Names**: Test names should clearly describe what is being tested
5. **Mock External Dependencies**: Use Jest mocks for APIs, localStorage, etc.

#### Test Structure
```javascript
describe('ComponentName', () => {
  const defaultProps = {
    // Define default props
  };

  beforeEach(() => {
    // Setup before each test
  });

  test('should render correctly', () => {
    // Test rendering
  });

  test('should handle user interactions', async () => {
    // Test interactions
  });

  test('should handle error states gracefully', () => {
    // Test error handling
  });
});
```

#### Using React Testing Library
- Use `screen.getByText()` for text content
- Use `screen.getByTestId()` for specific elements
- Use `fireEvent` for user interactions
- Use `waitFor` for async operations
- Wrap state changes in `act()`

### Common Test Patterns

#### Testing Modal Components
```javascript
test('opens and closes modal correctly', async () => {
  const onClose = jest.fn();
  render(<Modal isOpen={true} onClose={onClose} />);
  
  const closeButton = screen.getByRole('button', { name: /close/i });
  await act(async () => {
    fireEvent.click(closeButton);
  });
  
  expect(onClose).toHaveBeenCalled();
});
```

#### Testing Form Submissions
```javascript
test('submits form with correct data', async () => {
  const onSubmit = jest.fn();
  render(<Form onSubmit={onSubmit} />);
  
  const input = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  await act(async () => {
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
  });
  
  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

#### Testing Async Operations
```javascript
test('loads data and displays results', async () => {
  render(<DataComponent />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
  
  expect(screen.getByText('Result 1')).toBeInTheDocument();
});
```

### Debugging Tests

#### Common Issues
1. **Async State Updates**: Wrap state changes in `act()`
2. **Missing Mocks**: Ensure all external dependencies are mocked
3. **Timing Issues**: Use `waitFor` for async operations
4. **Component Not Found**: Check if component is actually rendered

#### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file with debug info
npm test -- --testPathPattern=ComponentName --verbose

# Run tests and show console output
npm test -- --verbose --no-coverage
```

### Continuous Integration

Tests are automatically run on:
- Pull request creation
- Code pushes to main branch
- Scheduled daily runs

#### CI Pipeline
1. Install dependencies
2. Run linting
3. Run unit tests
4. Run integration tests
5. Generate coverage report
6. Upload results

### Coverage Requirements

- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 100% coverage for data integrity tests
- **UI Components**: 90% coverage for user interaction tests

### Performance Testing

#### Test Performance
- Tests should complete within 30 seconds
- Individual test files should complete within 5 seconds
- Use `--maxWorkers=2` for CI environments

#### Memory Usage
- Monitor memory usage during test runs
- Clean up mocks and event listeners
- Use `afterEach` for cleanup

### Troubleshooting

#### Test Environment Issues
```bash
# Clear Jest cache
npm test -- --clearCache

# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Update Jest configuration
npm test -- --config=jest.config.js
```

#### Mock Issues
- Ensure mocks are defined before tests run
- Check mock implementation matches expected interface
- Verify mock cleanup in `afterEach`

#### Component Issues
- Check if component is properly exported
- Verify props are correctly passed
- Ensure component renders without errors

### Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Support

For test-related issues:
1. Check the troubleshooting section above
2. Review existing test patterns in the codebase
3. Consult the testing documentation
4. Create an issue with detailed error information