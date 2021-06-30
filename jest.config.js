/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  // test files are normally ignored from collecting code coverage
  // https://jestjs.io/docs/configuration#forcecoveragematch-arraystring
  collectCoverageFrom: ['src/**/*.{ts,js,jsx}', '!**/*.d.ts'],
};
