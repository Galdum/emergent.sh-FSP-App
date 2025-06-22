module.exports = {
  extends: ['react-app', 'react-app/jest'],
  env: {
    jest: true,
    browser: true,
    es6: true
  },
  globals: {
    test: 'readonly',
    expect: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly'
  }
};