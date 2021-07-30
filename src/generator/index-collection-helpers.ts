import * as path from 'path';

// Generate import names
const createImportName = (filename: string) => `\"./${filename}\";`;

// Prefix for wildcard export
const exportName = 'export * from';

// Extension of files
const ext = '.ts';

// Create an export statement for index.ts
export const exportContent = (fileName: string) =>
  `${exportName} ${createImportName(path.basename(fileName).replace(ext, ''))}`;
