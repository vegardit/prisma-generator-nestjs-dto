import fs from 'fs/promises';
import * as path from 'path';
import makeDir from 'make-dir';
import { parseEnvValue } from '@prisma/sdk';
import { generatorHandler } from '@prisma/generator-helper';
import { exportContent } from './generator/index-collection-helpers';

import type { GeneratorOptions } from '@prisma/generator-helper';

import { run } from './generator';
import { IndexCollection } from './generator/types';

export const stringToBoolean = (input: string, defaultValue = false) => {
  if (input === 'true') {
    return true;
  }
  if (input === 'false') {
    return false;
  }

  return defaultValue;
};

export const generate = async (options: GeneratorOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const output = parseEnvValue(options.generator.output!);

  const {
    connectDtoPrefix = 'Connect',
    createDtoPrefix = 'Create',
    updateDtoPrefix = 'Update',
    dtoSuffix = 'Dto',
    entityPrefix = '',
    entitySuffix = '',
  } = options.generator.config;

  const exportRelationModifierClasses = stringToBoolean(
    options.generator.config.exportRelationModifierClasses,
    true,
  );

  const outputToNestJsResourceStructure = stringToBoolean(
    options.generator.config.outputToNestJsResourceStructure,
    // using `true` as default value would be a breaking change
    false,
  );

  const reExport = stringToBoolean(
    options.generator.config.createIndex,
    // using `true` as default value would be a breaking change
    false,
  );

  const results = run({
    output,
    dmmf: options.dmmf,
    exportRelationModifierClasses,
    outputToNestJsResourceStructure,
    connectDtoPrefix,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
    entityPrefix,
    entitySuffix,
  });

  const indexCollections: IndexCollection = {};

  if (reExport) {
    results.forEach(({ fileName }) => {
      const dirName = path.dirname(fileName);
      if (Boolean(indexCollections[dirName])) {
        indexCollections[dirName] = `${
          indexCollections[dirName]
        }\n${exportContent(fileName)}`;
      } else {
        indexCollections[dirName] = exportContent(fileName);
      }
    });
  }

  return results.map(async ({ fileName, content }) => {
    const dirName = path.dirname(fileName);
    await makeDir(dirName);
    if (reExport && Boolean(indexCollections[dirName])) {
      await fs.writeFile(`${dirName}/index.ts`, indexCollections[dirName]);
    }
    return fs.writeFile(fileName, content);
  });
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});
