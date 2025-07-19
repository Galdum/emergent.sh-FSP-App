# Contributing to FSP Navigator

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running Tests

We use Jest and React Testing Library for our test suite. The tests are designed to catch UI regressions and ensure critical functionality remains intact.

#### Running All Tests
```bash
cd frontend
npm test
```

#### Running Tests in Watch Mode
```bash
cd frontend
npm test -- --watch
```

#### Running Tests with Coverage
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Test Structure

Our test suite includes regression tests for critical UI components that have been known to break in the past:

#### `competitionQuestions.test.js`
- **Purpose**: Ensures the competition data structure remains intact
- **Why it exists**: The `competitionQuestions.js` file was accidentally deleted in a previous commit, causing the Clasament (Leaderboard) component to crash
- **What it tests**: 
  - Data structure integrity
  - Required properties for competitions
  - Correspondence between game types and questions

#### `LeaderboardModal.test.jsx`
- **Purpose**: Ensures the leaderboard modal renders correctly and doesn't crash
- **Why it exists**: The modal was crashing with "Cannot read properties of undefined (reading 'competitions')" when the data file was missing
- **What it tests**:
  - Renders without crashing when competitions is empty
  - Handles missing competitionConfig gracefully
  - Tab navigation works correctly

#### `InteractiveTutorial.test.jsx`
- **Purpose**: Ensures the tutorial component has the correct number of steps and valid targets
- **Why it exists**: Tutorial steps were getting corrupted or missing in previous commits
- **What it tests**:
  - Correct number of tutorial steps (7 total)
  - All step targets are valid CSS selectors
  - Navigation buttons work correctly

#### `ToggleBar.test.jsx`
- **Purpose**: Ensures the progress toggle bar functionality is preserved
- **Why it exists**: The toggle bar component was accidentally removed from the main App component
- **What it tests**:
  - Toggle bar CSS classes are defined
  - Mobile and desktop modes are supported
  - State-based styling works correctly

### Writing New Tests

When adding new features or fixing bugs, please add corresponding tests:

1. **For new components**: Create a test file in `src/__tests__/`
2. **For bug fixes**: Add a test that would have caught the bug
3. **For data changes**: Update snapshot tests if needed

### Test Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Test the user experience**, not implementation details
3. **Use `act()` when testing components that cause state updates**
4. **Mock external dependencies** to isolate the component under test
5. **Add comments explaining why regression tests exist**

### Snapshot Testing

We use snapshot tests for data structures that should remain stable. When snapshots change:

1. Review the changes to ensure they're intentional
2. Update snapshots with: `npm test -- -u`
3. Commit both the code changes and updated snapshots

### Continuous Integration

Tests run automatically on:
- Pull requests
- Merges to main branch
- Nightly builds

All tests must pass before code can be merged.

## Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful commit messages
- Add JSDoc comments for complex functions

## Reporting Issues

When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/OS information
5. Any error messages from the console

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add/update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request with a clear description

## Why These Regression Tests Exist

The regression tests in this project were created after a series of commits in July 2025 that accidentally broke several UI components:

1. **Missing competitionQuestions.js**: Caused Clasament to crash
2. **Removed ToggleBar**: Progress toggle functionality was lost
3. **Corrupted tutorial steps**: Interactive tutorial became unusable
4. **Missing data directory**: Several components couldn't find required data

These tests ensure that similar regressions won't happen again by:
- Validating data structure integrity
- Ensuring critical components render correctly
- Checking that navigation elements are present
- Verifying that error handling works as expected

The tests are designed to fail early and clearly if any of these critical features are accidentally broken, preventing regressions from reaching production.