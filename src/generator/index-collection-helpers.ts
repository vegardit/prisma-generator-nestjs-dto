import { IndexCollection } from './types';
import * as path from 'path';

// Generate import names
const createImportName = (filename: string) => `\"./${filename}\";`;

// Prefix for wildcard export
const exportName = 'export * from';

// Extension of files
const ext = '.ts';

interface GenerateIndexParam {
  fileName: string;
  indexCollections: IndexCollection[];
}

// Updates the index collection
export const updateIndexCollection = ({
  fileName,
  indexCollections,
}: GenerateIndexParam) => {
  const current = indexCollections.findIndex(
    ({ dir }) => dir === path.dirname(fileName),
  );

  const exportContent = `${exportName} ${createImportName(
    path.basename(fileName).replace(ext, ''),
  )}`;

  const exists = current !== -1;

  const updatedIndex = {
    dir: exists ? indexCollections[current].dir : path.dirname(fileName),
    content: exists
      ? `${indexCollections[current].content}\n${exportContent}`
      : exportContent,
  };

  if (exists) indexCollections[current] = updatedIndex;
  else indexCollections.push(updatedIndex);
};
